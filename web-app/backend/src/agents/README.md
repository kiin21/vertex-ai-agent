# Agent Module

This module provides chat functionality with AI agents using Google Cloud Vertex AI.

## Features

- ✅ Create and manage chat sessions
- ✅ Send messages and receive streaming responses
- ✅ Store chat history in database
- ✅ Integration with Google Cloud Vertex AI
- ✅ Real-time chat via Server-Sent Events
- ✅ JWT Authentication
- ✅ User-scoped sessions

## API Endpoints

### Session Management

- `POST /agents/sessions` - Create new session
- `GET /agents/sessions` - List user sessions
- `GET /agents/sessions/:id` - Get session details
- `DELETE /agents/sessions/:id` - Delete session
- `GET /agents/sessions/:id/history` - Get chat history

### Chat

- `POST /agents/chat` - Send message (streaming response)
- `GET /agents/chat/stream` - Server-Sent Events for real-time chat

## Database Schema

### AgentSession

- Stores chat session metadata
- Links to external Vertex AI session
- Tracks message count and last update time

### AgentChat

- Stores individual chat messages
- Supports both user and AI messages
- Includes metadata like usage statistics

## Usage Example

```typescript
// Create session
const session = await agentService.createSession({ userId: 'user123' });

// Send message with streaming
await agentService.sendMessage(
  {
    userId: 'user123',
    sessionId: session.id,
    message: 'Hello, how can you help me?',
  },
  (streamData) => {
    console.log('Streaming:', streamData.content);
  },
);
```

## Configuration

The module requires Google Cloud credentials to be configured for Vertex AI access. Make sure to set up proper authentication in your environment.

## Testing

Run the tests with:

```bash
npm run test -- agents
```
