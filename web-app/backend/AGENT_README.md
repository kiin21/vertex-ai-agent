# Agent Chat Backend

Đây là backend được thiết kế để phục vụ tính năng chat với AI Agent, sử dụng Google Cloud Vertex AI.

## Tính năng

### 🤖 Agent Chat System

- **Quản lý Session**: Tạo, liệt kê, xem chi tiết và xóa session chat
- **Chat Real-time**: Gửi tin nhắn và nhận phản hồi streaming từ AI
- **Lưu trữ lịch sử**: Lưu trữ đầy đủ lịch sử chat trong database
- **Tích hợp Vertex AI**: Kết nối với Google Cloud Vertex AI Reasoning Engine

### 🏗️ Kiến trúc

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Client Apps   │◄──►│  Agent Controller │◄──►│   Agent Service     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                           │
                                                           ▼
                        ┌──────────────────┐    ┌─────────────────────┐
                        │    Database      │◄──►│  VertexAI Service   │
                        │  (PostgreSQL)    │    │                     │
                        └──────────────────┘    └─────────────────────┘
                                                           │
                                                           ▼
                                              ┌─────────────────────────┐
                                              │  Google Cloud Vertex AI │
                                              │   Reasoning Engine      │
                                              └─────────────────────────┘
```

### 📊 Database Schema

#### Agent Sessions Table

```sql
agent_sessions (
  id                uuid PRIMARY KEY,
  external_id       varchar NOT NULL,    -- ID từ Vertex AI
  user_id           uuid NOT NULL,       -- FK to users table
  app_name          varchar NOT NULL,    -- Tên app từ Vertex AI
  state             enum NOT NULL,       -- active, inactive, deleted
  session_metadata  json,                -- Metadata từ Vertex AI
  last_update_time  bigint NOT NULL,     -- Timestamp từ Vertex AI
  title             varchar,             -- Tiêu đề session
  summary           text,                -- Tóm tắt nội dung
  message_count     integer DEFAULT 0,   -- Số lượng tin nhắn
  created_at        timestamp,
  updated_at        timestamp
)
```

#### Agent Chats Table

```sql
agent_chats (
  id                uuid PRIMARY KEY,
  session_id        uuid NOT NULL,       -- FK to agent_sessions
  external_id       varchar,             -- ID từ Vertex AI
  invocation_id     varchar,             -- Invocation ID từ Vertex AI
  role              enum NOT NULL,       -- user, model, system
  author            enum NOT NULL,       -- user, orchestrator_agent, system
  content           text NOT NULL,       -- Nội dung tin nhắn
  metadata          json,                -- Metadata từ Vertex AI
  actions           json,                -- Actions từ Vertex AI
  thought_signature varchar,             -- Thought signature từ AI
  finish_reason     varchar,             -- Lý do kết thúc
  usage_metadata    json,                -- Thông tin usage
  timestamp         bigint NOT NULL,     -- Timestamp
  turn_complete     boolean DEFAULT false,
  error_message     varchar,
  error_code        varchar,
  created_at        timestamp,
  updated_at        timestamp
)
```

## API Endpoints

### Session Management

#### 🔄 Tạo Session Mới

```http
POST /agents/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user123"
}
```

**Response:**

```json
{
  "session": {
    "id": "uuid",
    "externalId": "5242399423224348672",
    "userId": "user123",
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

#### 📋 Liệt kê Sessions

```http
GET /agents/sessions?userId=user123&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**

```json
{
  "sessions": [
    {
      "id": "uuid",
      "externalId": "5242399423224348672",
      "userId": "user123",
      "title": "Chat về thời tiết",
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

#### 👁️ Xem Chi tiết Session

```http
GET /agents/sessions/{sessionId}?userId=user123
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "uuid",
  "externalId": "5242399423224348672",
  "userId": "user123",
  "title": "Chat về thời tiết",
  "messageCount": 5,
  "lastUpdateTime": 1756490954992,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "chats": [
    {
      "id": "uuid",
      "role": "user",
      "author": "user",
      "content": "Thời tiết hôm nay thế nào?",
      "timestamp": 1756490418498,
      "turnComplete": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "model",
      "author": "orchestrator_agent",
      "content": "Tôi không thể truy cập dữ liệu thời tiết thời gian thực...",
      "timestamp": 1756490418677,
      "turnComplete": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 🗑️ Xóa Session

```http
DELETE /agents/sessions/{sessionId}?userId=user123
Authorization: Bearer <token>
```

### Chat Interface

#### 💬 Gửi Tin nhắn (Streaming)

```http
POST /agents/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user123",
  "sessionId": "uuid",
  "message": "Tỷ giá USD sang VND hôm nay là bao nhiêu?"
}
```

**Response (Streaming):**

```
data: {"type":"chunk","data":{"content":"Tôi","isComplete":false,"timestamp":1756491188991}}

data: {"type":"chunk","data":{"content":" không thể","isComplete":false,"timestamp":1756491188992}}

data: {"type":"chunk","data":{"content":" cung cấp","isComplete":false,"timestamp":1756491188993}}

data: {"type":"complete","data":{"isComplete":true,"timestamp":1756491188994}}
```

#### 🌊 Server-Sent Events

```http
GET /agents/chat/stream?userId=user123&sessionId=uuid&message=Hello
Authorization: Bearer <token>
```

## Cấu hình

### Environment Variables

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=vertexai-469617
GOOGLE_CLOUD_LOCATION=us-central1
REASONING_ENGINE_ID=1927404301072728064

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=student_api_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Google Cloud Authentication

Ứng dụng sử dụng Google Cloud Application Default Credentials (ADC):

1. **Local Development:**

   ```bash
   gcloud auth application-default login
   ```

2. **Production:**
   - Sử dụng Service Account Key
   - Hoặc Google Cloud Run/GKE với Workload Identity

## Sử dụng

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Database

```bash
# Chạy migration
npm run migration:run

# Seed dữ liệu mẫu (optional)
npm run seed
```

### 3. Start Development Server

```bash
npm run start:dev
```

### 4. API Documentation

Truy cập: `http://localhost:3000/api/docs`

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Agent Chat

```bash
# Tạo session
curl -X POST http://localhost:3000/agents/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# Gửi tin nhắn
curl -X POST http://localhost:3000/agents/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","sessionId":"<session-id>","message":"Hello"}'
```

## Lưu ý Quan trọng

### 🔒 Security

- Tất cả endpoints đều yêu cầu JWT authentication
- Rate limiting được áp dụng
- Input validation và sanitization

### 🚀 Performance

- Database indexing cho session và chat queries
- Connection pooling cho database
- Caching cho session metadata

### 📝 Logging

- Structured logging với Winston
- Request/response logging
- Error tracking

### 🔧 Monitoring

- Health check endpoints
- Metrics collection
- Error reporting

## Troubleshooting

### Lỗi thường gặp:

1. **Google Cloud Authentication Error**

   ```
   Error: Authentication failed
   ```

   **Solution:** Chạy `gcloud auth application-default login`

2. **Database Connection Error**

   ```
   Error: Connection refused
   ```

   **Solution:** Kiểm tra database config trong `.env`

3. **Vertex AI API Error**
   ```
   Error: Failed to create session with AI service
   ```
   **Solution:** Kiểm tra `REASONING_ENGINE_ID` và quyền truy cập

## Architecture Decisions

### Tại sao sử dụng TypeORM?

- Type safety với TypeScript
- Migration system mạnh mẽ
- Active Record pattern dễ sử dụng
- Hỗ trợ multiple databases

### Tại sao tách Agent Service?

- Separation of concerns
- Dễ test và maintain
- Có thể swap external AI service
- Reusable cho other modules

### Tại sao lưu chat history?

- Trải nghiệm người dùng tốt hơn
- Analytics và insights
- Debugging và monitoring
- Compliance requirements

## Future Enhancements

- [ ] WebSocket support cho real-time updates
- [ ] Chat export functionality
- [ ] Multi-language support
- [ ] Voice chat integration
- [ ] File attachments support
- [ ] Chat search functionality
- [ ] Analytics dashboard
- [ ] A/B testing framework
