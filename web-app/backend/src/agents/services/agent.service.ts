import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentSession, AgentChat, AgentSessionState, AgentChatRole, AgentChatAuthor } from '../entities';
import { VertexAiService } from './vertex-ai.service';
import {
  CreateSessionDto,
  SendMessageDto,
  SessionResponseDto,
  ChatMessageResponseDto,
  StreamResponseDto,
} from '../dto';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(AgentSession)
    private readonly sessionRepository: Repository<AgentSession>,
    @InjectRepository(AgentChat)
    private readonly chatRepository: Repository<AgentChat>,
    private readonly vertexAiService: VertexAiService,
  ) { }

  async createSession(createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
    try {
      // Create session in external API
      const externalResponse = await this.vertexAiService.createSession(createSessionDto.userId);
      const externalSession = externalResponse.output;

      // Create local session record
      const session = this.sessionRepository.create({
        externalId: externalSession.id,
        userId: createSessionDto.userId,
        appName: externalSession.appName,
        state: AgentSessionState.ACTIVE,
        sessionMetadata: externalSession.state,
        lastUpdateTime: Math.floor(externalSession.lastUpdateTime),
        messageCount: 0,
      });

      const savedSession = await this.sessionRepository.save(session);

      return this.mapToSessionResponse(savedSession);
    } catch (error) {
      throw new BadRequestException(`Failed to create session: ${error.message}`);
    }
  }

  async listUserSessions(userId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.find({
      where: { userId, state: AgentSessionState.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    return sessions.map(session => this.mapToSessionResponse(session));
  }

  async getSession(sessionId: string, userId: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Optionally sync with external API
    try {
      const externalResponse = await this.vertexAiService.getSession(userId, session.externalId);
      const externalSession = externalResponse.output;

      // Update local session with latest data
      session.updateFromExternalSession(externalSession);
      await this.sessionRepository.save(session);
    } catch (error) {
      // Continue with local data if external sync fails
      console.warn('Failed to sync session with external API:', error.message);
    }

    return this.mapToSessionResponse(session);
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    try {
      // Delete from external API
      await this.vertexAiService.deleteSession(userId, session.externalId);

      // Soft delete local session
      session.state = AgentSessionState.DELETED;
      await this.sessionRepository.save(session);
    } catch (error) {
      throw new BadRequestException(`Failed to delete session: ${error.message}`);
    }
  }

  async sendMessage(
    sendMessageDto: SendMessageDto,
    onStreamData: (data: StreamResponseDto) => void,
  ): Promise<void> {
    console.log('SendMessage request:', {
      userId: sendMessageDto.userId,
      sessionId: sendMessageDto.sessionId,
      messagePreview: sendMessageDto.message.substring(0, 100)
    });

    const session = await this.sessionRepository.findOne({
      where: { id: sendMessageDto.sessionId, userId: sendMessageDto.userId },
    });

    if (!session) {
      console.error('Session not found:', {
        sessionId: sendMessageDto.sessionId,
        userId: sendMessageDto.userId
      });
      throw new NotFoundException('Session not found');
    }

    try {
      // Save user message
      const userMessage = this.chatRepository.create({
        sessionId: session.id,
        role: AgentChatRole.USER,
        author: AgentChatAuthor.USER,
        content: sendMessageDto.message,
        timestamp: Math.floor(Date.now() / 1000),
      });
      await this.chatRepository.save(userMessage);
      session.incrementMessageCount();

      // Stream response from external API
      await this.vertexAiService.streamQuery(
        sendMessageDto.userId,
        session.externalId,
        sendMessageDto.message,
        async (streamData) => {
          console.log('Service received stream data:', streamData);

          try {
            // Save AI response - use the processed streamData directly
            const aiMessage = AgentChat.fromExternalEvent(session.id, streamData);
            console.log('Created AI message:', {
              role: aiMessage.role,
              author: aiMessage.author,
              contentPreview: aiMessage.content.substring(0, 100)
            });

            await this.chatRepository.save(aiMessage);
            session.incrementMessageCount();

            // Send to client - the content is already extracted in vertex-ai.service
            const responseData: StreamResponseDto = {
              content: streamData.content,
              finishReason: streamData.finishReason || streamData.finish_reason,
              usageMetadata: streamData.usageMetadata || streamData.usage_metadata,
              invocationId: streamData.invocationId || streamData.invocation_id,
              author: streamData.author,
              timestamp: streamData.timestamp,
            };

            console.log('Sending to controller:', responseData);
            onStreamData(responseData);
          } catch (streamError) {
            console.error('Error processing stream data:', streamError);
            // Continue with the stream even if one chunk fails
          }
        },
      );

      await this.sessionRepository.save(session);
    } catch (error) {
      console.error('SendMessage error:', {
        message: error.message,
        stack: error.stack,
        userId: sendMessageDto.userId,
        sessionId: sendMessageDto.sessionId
      });
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  async getChatHistory(sessionId: string, userId: string): Promise<ChatMessageResponseDto[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const chats = await this.chatRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });

    return chats.map(chat => this.mapToChatResponse(chat));
  }

  private mapToSessionResponse(session: AgentSession): SessionResponseDto {
    return {
      id: session.id,
      externalId: session.externalId,
      userId: session.userId,
      appName: session.appName,
      state: session.state,
      title: session.title,
      summary: session.summary,
      messageCount: session.messageCount,
      lastUpdateTime: session.lastUpdateTime,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  private extractContentFromStreamData(streamData: any): string {
    // Try different content extraction strategies based on the external API response

    // Strategy 1: Direct content field
    if (typeof streamData.content === 'string') {
      return streamData.content;
    }

    // Strategy 2: Content with parts array (like Vertex AI format)
    if (streamData.content?.parts && Array.isArray(streamData.content.parts)) {
      return streamData.content.parts
        .map((part: any) => part.text || '')
        .filter((text: string) => text.trim())
        .join(' ');
    }

    // Strategy 3: Direct text field
    if (streamData.content?.text) {
      return streamData.content.text;
    }

    // Strategy 4: Message field
    if (streamData.message) {
      return streamData.message;
    }

    // Strategy 5: Text field at root level
    if (streamData.text) {
      return streamData.text;
    }

    // Fallback: empty string
    return '';
  }

  private mapToChatResponse(chat: AgentChat): ChatMessageResponseDto {
    return {
      id: chat.id,
      sessionId: chat.sessionId,
      role: chat.role,
      author: chat.author,
      content: chat.content,
      timestamp: chat.timestamp,
      finishReason: chat.finishReason,
      usageMetadata: chat.usageMetadata,
      createdAt: chat.createdAt,
    };
  }
}
