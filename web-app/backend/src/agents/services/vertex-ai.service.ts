import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { GoogleAuth } from 'google-auth-library';

export interface VertexAiSessionResponse {
  output: {
    id: string;
    lastUpdateTime: number;
    state: Record<string, any>;
    appName: string;
    userId: string;
    events: any[];
  };
}

export interface VertexAiSessionsResponse {
  output: {
    sessions: Array<{
      id: string;
      lastUpdateTime: number;
      state: Record<string, any>;
      appName: string;
      userId: string;
      events: any[];
    }>;
  };
}

export interface VertexAiSessionDetailsResponse {
  output: {
    id: string;
    events: any[];
    userId: string;
    lastUpdateTime: number;
    state: Record<string, any>;
    appName: string;
  };
}

@Injectable()
export class VertexAiService {
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly auth: GoogleAuth;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
    const location = this.configService.get<string>('GOOGLE_CLOUD_LOCATION');
    const resourceId = this.configService.get<string>('RESOURCE_ID');

    if (!projectId || !location || !resourceId) {
      throw new Error('Missing required Google Cloud configuration: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_LOCATION, or RESOURCE_ID');
    }

    this.baseUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/reasoningEngines/${resourceId}`;

    console.log('Vertex AI Service initialized with:', {
      projectId,
      location,
      resourceId,
      baseUrl: this.baseUrl
    });

    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.configService.get<number>('VERTEX_AI_TIMEOUT', 30000),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.httpClient.interceptors.request.use(async (config) => {
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();

      if (accessToken?.token) {
        config.headers.Authorization = `Bearer ${accessToken.token}`;
      }

      return config;
    });
  }

  async createSession(userId: string): Promise<VertexAiSessionResponse> {
    try {
      const requestPayload = {
        class_method: 'async_create_session',
        input: { user_id: userId },
      };

      console.log('Creating session for user:', userId);
      const response = await this.httpClient.post(':query', requestPayload);
      console.log('Session created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create session:', {
        userId,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  async listSessions(userId: string): Promise<VertexAiSessionsResponse> {
    try {
      const response = await this.httpClient.post(':query', {
        class_method: 'async_list_sessions',
        input: { user_id: userId },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to list sessions:', {
        userId,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getSession(userId: string, sessionId: string): Promise<VertexAiSessionDetailsResponse> {
    try {
      const response = await this.httpClient.post(':query', {
        class_method: 'async_get_session',
        input: { user_id: userId, session_id: sessionId },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get session:', {
        userId,
        sessionId,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    try {
      await this.httpClient.post(':query', {
        class_method: 'async_delete_session',
        input: { user_id: userId, session_id: sessionId },
      });
    } catch (error) {
      console.error('Failed to delete session:', {
        userId,
        sessionId,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async streamQuery(
    userId: string,
    sessionId: string,
    message: string,
    onData: (data: any) => void,
  ): Promise<void> {
    try {
      const requestPayload = {
        class_method: 'async_stream_query',
        input: {
          user_id: userId,
          session_id: sessionId,
          message,
        },
      };

      console.log('Vertex AI Request:', JSON.stringify(requestPayload, null, 2));

      // Make API call with streaming support
      const response = await this.httpClient.post(':streamQuery?alt=sse', requestPayload, {
        responseType: 'stream',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      console.log('Vertex AI Stream Response initiated');

      let rawData = '';
      let dataProcessed = false;

      // Handle stream data
      response.data.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        console.log('Raw SSE chunk:', text);
        rawData += text;

        // Try to parse and process data immediately if it looks complete
        if (!dataProcessed && text.includes('"finish_reason"')) {
          try {
            const parsedData = JSON.parse(rawData);
            console.log('Parsed stream data:', parsedData);

            // Extract the text content from the response
            if (parsedData.content && parsedData.content.parts && parsedData.content.parts.length > 0) {
              const textContent = parsedData.content.parts[0].text;
              console.log('Extracted text content:', textContent);

              // Create a simplified response object with the extracted text
              const responseData = {
                content: textContent,
                role: parsedData.content.role || 'model',
                finish_reason: parsedData.finish_reason,
                usage_metadata: parsedData.usage_metadata,
                timestamp: parsedData.timestamp,
                id: parsedData.id,
                author: parsedData.author,
                invocationId: parsedData.invocation_id,
              };

              onData(responseData);
              dataProcessed = true;
            }
          } catch (parseError) {
            // If parsing fails, wait for more data
            console.log('Partial data received, waiting for more...');
          }
        }
      });

      response.data.on('end', () => {
        console.log('SSE stream ended');

        // Only process if we haven't already processed the data
        if (!dataProcessed) {
          try {
            // Parse the JSON response
            const parsedData = JSON.parse(rawData);
            console.log('Parsed stream data:', parsedData);

            // Extract the text content from the response
            if (parsedData.content && parsedData.content.parts && parsedData.content.parts.length > 0) {
              const textContent = parsedData.content.parts[0].text;
              console.log('Extracted text content:', textContent);

              // Create a simplified response object with the extracted text
              const responseData = {
                content: textContent,
                role: parsedData.content.role || 'model',
                finish_reason: parsedData.finish_reason,
                usage_metadata: parsedData.usage_metadata,
                timestamp: parsedData.timestamp,
                id: parsedData.id,
                author: parsedData.author,
                invocationId: parsedData.invocation_id,
              };

              onData(responseData);
            } else {
              console.error('No text content found in response');
              // Still call onData to ensure the flow continues
              onData({
                content: '',
                role: 'model',
                finish_reason: parsedData.finish_reason,
                usage_metadata: parsedData.usage_metadata,
                timestamp: parsedData.timestamp,
                id: parsedData.id,
                author: parsedData.author,
                invocationId: parsedData.invocation_id,
              });
            }
          } catch (parseError) {
            console.error('Failed to parse stream data as JSON:', parseError);
            throw new Error('Unable to parse stream response');
          }
        }
      });

      response.data.on('error', (error: Error) => {
        console.error('SSE stream error:', error);
        throw error;
      });

      // Wait for the stream to complete
      await new Promise<void>((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });

    } catch (error) {
      console.error('Vertex AI Stream Query Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        userId,
        sessionId,
        messagePreview: message.substring(0, 100)
      });
      throw error;
    }
  }
}
