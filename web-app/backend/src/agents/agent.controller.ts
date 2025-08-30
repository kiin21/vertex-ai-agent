import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AgentService } from './services/agent.service';
import {
  CreateSessionDto,
  SendMessageDto,
  SessionResponseDto,
  ChatMessageResponseDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Session created successfully',
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUser() user: any,
  ): Promise<SessionResponseDto> {

    // Extract userId from the sub field (which contains the actual user ID)
    const userId = user?.sub || user?.id;
    console.log('Final userId being passed:', userId);

    // Override userId from token for security
    createSessionDto.userId = userId;

    return this.agentService.createSession(createSessionDto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List user chat sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessions retrieved successfully',
    type: [SessionResponseDto],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async listSessions(@CurrentUser() user: any): Promise<SessionResponseDto[]> {
    const userId = user?.sub || user?.id;
    return this.agentService.listUserSessions(userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session retrieved successfully',
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getSession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: any,
  ): Promise<SessionResponseDto> {
    const userId = user?.sub || user?.id;
    return this.agentService.getSession(sessionId, userId);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Session deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async deleteSession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    const userId = user?.sub || user?.id;
    await this.agentService.deleteSession(sessionId, userId);
  }

  @Get('sessions/:id/history')
  @ApiOperation({ summary: 'Get chat history for a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat history retrieved successfully',
    type: [ChatMessageResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getChatHistory(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: any,
  ): Promise<ChatMessageResponseDto[]> {
    const userId = user?.sub || user?.id;
    return this.agentService.getChatHistory(sessionId, userId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send a message and receive streaming response' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message sent successfully, streaming response',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ): Promise<void> {
    // Extract userId from the token
    const userId = user?.sub || user?.id;

    // Override userId from token for security
    sendMessageDto.userId = userId;

    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    try {
      let hasData = false;

      await this.agentService.sendMessage(sendMessageDto, (streamData) => {
        console.log('Controller received stream data:', streamData);

        // Send each chunk as Server-Sent Event
        res.write(`data: ${JSON.stringify(streamData)}\n\n`);
        hasData = true;
      });

      // Only send completion if we actually received data
      if (hasData) {
        res.write('event: complete\n');
        res.write('data: {}\n\n');
      }
    } catch (error) {
      console.error('Controller error:', error);
      // Send error event
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
