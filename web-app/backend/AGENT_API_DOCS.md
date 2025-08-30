# Agent Chat API Documentation

## Overview

API này cung cấp tính năng chat với AI Agent sử dụng Google Cloud Vertex AI. Hỗ trợ cả JSON response và streaming response qua Server-Sent Events.

## Base URL

```
http://localhost:3000
```

## Authentication

Tất cả endpoints đều yêu cầu JWT Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Chat Session

Tạo session chat mới với AI Agent.

**Request:**

```http
POST /agents/sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**

```json
{
  "session": {
    "id": "uuid",
    "externalId": "5242399423224348672",
    "userId": "string",
    "appName": "string",
    "state": "active",
    "title": null,
    "summary": null,
    "messageCount": 0,
    "lastUpdateTime": 1756490954992,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Session created successfully"
}
```

### 2. List User Sessions

Lấy danh sách sessions của user với pagination.

**Request:**

```http
GET /agents/sessions?userId=string&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**

```json
{
  "sessions": [
    {
      "id": "uuid",
      "externalId": "5242399423224348672",
      "userId": "string",
      "title": "Chat title",
      "messageCount": 5,
      "lastUpdateTime": 1756490954992,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### 3. Get Session Details

Lấy chi tiết session và lịch sử chat.

**Request:**

```http
GET /agents/sessions/{sessionId}?userId=string
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "uuid",
  "externalId": "5242399423224348672",
  "userId": "string",
  "title": "Chat title",
  "messageCount": 5,
  "lastUpdateTime": 1756490954992,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "chats": [
    {
      "id": "uuid",
      "role": "user",
      "author": "user",
      "content": "Hello, how are you?",
      "timestamp": 1756490418498,
      "turnComplete": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "model",
      "author": "orchestrator_agent",
      "content": "I'm doing well, thank you for asking!",
      "timestamp": 1756490418677,
      "turnComplete": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4. Delete Session

Xóa session và tất cả chat messages.

**Request:**

```http
DELETE /agents/sessions/{sessionId}?userId=string
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Session deleted successfully"
}
```

### 5. Send Message (JSON Response)

Gửi tin nhắn và nhận phản hồi hoàn chỉnh dưới dạng JSON.

**Request:**

```http
POST /agents/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "string",
  "sessionId": "uuid",
  "message": "What's the weather like today?"
}
```

**Response:**

```json
{
  "userMessage": {
    "id": "uuid",
    "role": "user",
    "author": "user",
    "content": "What's the weather like today?",
    "timestamp": 1756490418498,
    "turnComplete": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "aiResponse": {
    "id": "uuid",
    "role": "model",
    "author": "orchestrator_agent",
    "content": "I don't have access to real-time weather data...",
    "timestamp": 1756490418677,
    "turnComplete": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 6. Send Message (Streaming Response)

Gửi tin nhắn và nhận phản hồi streaming qua Server-Sent Events.

**Request:**

```http
GET /agents/chat/stream?userId=string&sessionId=uuid&message=Hello
Authorization: Bearer <token>
```

**Response (Server-Sent Events):**

```
Content-Type: text/plain; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"chunk","data":{"content":"Hello","isComplete":false,"timestamp":1756491188991}}

data: {"type":"chunk","data":{"content":" there!","isComplete":false,"timestamp":1756491188992}}

data: {"type":"chunk","data":{"content":" How","isComplete":false,"timestamp":1756491188993}}

data: {"type":"chunk","data":{"content":" can I help","isComplete":false,"timestamp":1756491188994}}

data: {"type":"chunk","data":{"content":" you today?","isComplete":false,"timestamp":1756491188995}}

data: {"type":"complete","data":{"isComplete":true,"timestamp":1756491188996}}
```

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Session not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Failed to communicate with AI service",
  "error": "Internal Server Error"
}
```

## Frontend Integration Examples

### React Example (JSON Response)

```jsx
import React, { useState } from 'react';

function ChatComponent({ userId, sessionId, authToken }) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          sessionId,
          message,
        }),
      });

      const data = await res.json();
      setResponse(data.aiResponse.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

### React Example (Streaming Response)

```jsx
import React, { useState } from 'react';

function StreamingChatComponent({ userId, sessionId, authToken }) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);

  const sendStreamingMessage = async () => {
    setStreaming(true);
    setResponse('');

    try {
      const url = `/agents/chat/stream?userId=${userId}&sessionId=${sessionId}&message=${encodeURIComponent(
        message,
      )}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              setResponse((prev) => prev + data.data.content);
            } else if (data.type === 'complete') {
              setStreaming(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setStreaming(false);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={sendStreamingMessage} disabled={streaming}>
        {streaming ? 'Streaming...' : 'Send'}
      </button>
      <div>{response}</div>
    </div>
  );
}
```

### JavaScript (Vanilla) Example

```javascript
// Create session
async function createSession(userId, authToken) {
  const response = await fetch('/agents/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  return data.session.id;
}

// Send message with streaming
function sendStreamingMessage(userId, sessionId, message, authToken) {
  const url = `/agents/chat/stream?userId=${userId}&sessionId=${sessionId}&message=${encodeURIComponent(
    message,
  )}`;

  const eventSource = new EventSource(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'chunk') {
      // Append chunk to display
      document.getElementById('response').innerText += data.data.content;
    } else if (data.type === 'complete') {
      // Streaming complete
      eventSource.close();
    }
  };

  eventSource.onerror = function (event) {
    console.error('SSE error:', event);
    eventSource.close();
  };
}
```

## Rate Limiting

API có rate limiting để bảo vệ service:

- 100 requests per minute per user
- 10 concurrent streams per user

## WebSocket Support (Future)

Trong tương lai sẽ hỗ trợ WebSocket cho real-time bidirectional communication:

```javascript
const ws = new WebSocket('ws://localhost:3000/agents/ws');
ws.onopen = function () {
  ws.send(
    JSON.stringify({
      type: 'auth',
      token: authToken,
    }),
  );
};
```

## Best Practices

1. **Always handle errors**: API có thể trả về lỗi 500 nếu Google Cloud service không available
2. **Use streaming for better UX**: Streaming response cung cấp trải nghiệm tốt hơn cho user
3. **Implement retry logic**: Retry failed requests với exponential backoff
4. **Cache sessions**: Lưu session ID để không phải tạo mới mỗi lần
5. **Handle timeouts**: Set appropriate timeout cho streaming connections

## Testing

Sử dụng script được cung cấp để test:

```bash
./test-agent.sh
```

Hoặc test manual với curl:

```bash
# Create session
curl -X POST http://localhost:3000/agents/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# Send message
curl -X POST http://localhost:3000/agents/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","sessionId":"<session-id>","message":"Hello"}'
```
