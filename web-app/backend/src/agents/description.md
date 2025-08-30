# Agent Chat Module

This is the agent module, which serves the chat feature with AI agents.

## Features

- Create and manage chat sessions
- Send messages and receive streaming responses
- Store chat history in database
- Integration with Google Cloud Vertex AI
- Real-time chat via Server-Sent Events

## Architecture

### Entities

- `AgentSession`: Manages chat sessions with users
- `AgentChat`: Stores individual chat messages

### Services

- `AgentService`: Main business logic for chat operations
- `VertexAiService`: Integration with Google Cloud Vertex AI

### External API Integration

This module integrates with Google Cloud Vertex AI Reasoning Engine API:

**Base URL**: `https://us-central1-aiplatform.googleapis.com/v1/projects/vertexai-469617/locations/us-central1/reasoningEngines/1927404301072728064`

**Endpoints Used**:

1. **Create Session**: `:query` with `async_create_session`
2. **List Sessions**: `:query` with `async_list_sessions`
3. **Get Session**: `:query` with `async_get_session`
4. **Delete Session**: `:query` with `async_delete_session`
5. **Stream Chat**: `:streamQuery` with `async_stream_query`

## API Endpoints

### Session Management

- `POST /agents/sessions` - Create new session
- `GET /agents/sessions` - List user sessions
- `GET /agents/sessions/:id` - Get session details
- `DELETE /agents/sessions/:id` - Delete session

### Chat

- `POST /agents/chat` - Send message (streaming response)
- `GET /agents/chat/stream` - Server-Sent Events for real-time chat

## Usage Example

```typescript
// Create session
const session = await agentService.createSession({ userId: 'user123' });

// Send message
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

---

## Original External API Documentation

this will call the external api, which has these concept: session, user

one user has many sessions, each session has chat history (time and content, ...)

this is the external api:

- Create a session:
  curl \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/vertexai-469617/locations/us-central1/reasoningEngines/1927404301072728064:query -d '{"class_method": "async_create_session", "input": {"user_id": "USER_ID"},}'
  {
  "output": {
  "id": "5242399423224348672",
  "lastUpdateTime": 1756490954.9925039,
  "state": {},
  "appName": "1927404301072728064",
  "userId": "USER_ID",
  "events": []
  }
  }

- List sessions:
  curl \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/vertexai-469617/locations/us-central1/reasoningEngines/1927404301072728064:query -d '{"class_method": "async_list_sessions", "input": {"user_id": "USER_ID"},}'

{
"output": {
"sessions": [
{
"state": {},
"id": "5242399423224348672",
"events": [],
"appName": "1927404301072728064",
"userId": "USER_ID",
"lastUpdateTime": 1756490954.9925039
},
{
"events": [],
"id": "5314034804797210624",
"appName": "1927404301072728064",
"lastUpdateTime": 1756490419.7879109,
"userId": "USER_ID",
"state": {}
}
]
}
}

- Get session:
  curl \  
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/vertexai-469617/locations/us-central1/reasoningEngines/1927404301072728064:query -d '{"class_method": "async_get_session", "input": {"user_id": "USER_ID", "session_id": "5314034804797210624"},}'
  {
  "output": {
  "id": "5314034804797210624",
  "events": [
  {
  "outputTranscription": null,
  "longRunningToolIds": null,
  "invocationId": "e-eee38665-6f0d-431e-9bbe-8f5db6990e16",
  "partial": null,
  "author": "user",
  "id": "4332312345876365312",
  "usageMetadata": null,
  "interrupted": null,
  "groundingMetadata": null,
  "actions": {
  "transferToAgent": null,
  "skipSummarization": null,
  "stateDelta": {},
  "requestedAuthConfigs": {},
  "escalate": null,
  "artifactDelta": {}
  },
  "finishReason": null,
  "timestamp": 1756490418.498837,
  "content": {
  "parts": [
  {
  "text": "What is the exchange rate from US dollars to SEK today?",
  "fileData": null,
  "codeExecutionResult": null,
  "functionCall": null,
  "thought": null,
  "inlineData": null,
  "executableCode": null,
  "thoughtSignature": null,
  "functionResponse": null,
  "videoMetadata": null
  }
  ],
  "role": "user"
  },
  "errorMessage": null,
  "liveSessionResumptionUpdate": null,
  "inputTranscription": null,
  "customMetadata": null,
  "turnComplete": null,
  "branch": null,
  "errorCode": null
  },
  {
  "content": {
  "parts": [
  {
  "executableCode": null,
  "inlineData": null,
  "functionCall": null,
  "codeExecutionResult": null,
  "fileData": null,
  "thought": null,
  "thoughtSignature": "CpEDAcu98PD5ih7MAj9HcBV7GknOtEowPJOijTxYpmeCj6OCFsnjgWG6D8y0IM9I4i9RmbawXcMG_qsxJ9Fe7yQGOSlNNNeWozzZ0Zj9yOsF9eRiHlsOtZSfc6p-0PWuzrdx164Ey3E_TaljjSuzRYFPrmt2RAupfNcnTGTIUxDg9q5-3JUJbn3s6DTxt_d1d9eSF4dIFzll90faCEihslcsjoQrjOiC7o2-KxRvY3UOgciArBO8Yg5e81F23mqtZe1-FLpqv3UTr4CS3ekV8iORNGGXZ6KPpV1eO-CX0muvdfX3hmCk-G92_zpvmsH5ahslrdEK6XfX2Q2T39hlnmMyC2fcjyOx4lMd74bSZ1T58OXMw5yMcjo7jMdLKmTM1ddwqk6JsXNiF00yBSsthX52sI2ZtmXu5ovk88tI5JfGFT-7Jq3BT-ucrbN58801PHPiAkqoXw4aixjCzgPTxiOumcbtJX7R83esXxBuhQh7Z5btHyIDhYV6wJL7PeQW7Hz5eWv4OAMpLTgOY_MG6-ImPkM=",
  "text": "I'm sorry, I don't have real-time exchange rate data. Exchange rates fluctuate constantly throughout the day.\n\nTo get the most accurate and up-to-date exchange rate, I recommend checking a reliable financial news website, a currency exchange app, or your bank's website.",
  "functionResponse": null,
  "videoMetadata": null
  }
  ],
  "role": "model"
  },
  "inputTranscription": null,
  "usageMetadata": null,
  "finishReason": null,
  "liveSessionResumptionUpdate": null,
  "errorCode": null,
  "interrupted": null,
  "longRunningToolIds": null,
  "author": "orchestrator_agent",
  "timestamp": 1756490418.677649,
  "turnComplete": null,
  "errorMessage": null,
  "partial": null,
  "groundingMetadata": null,
  "invocationId": "e-eee38665-6f0d-431e-9bbe-8f5db6990e16",
  "outputTranscription": null,
  "branch": null,
  "id": "2629951686730317824",
  "actions": {
  "skipSummarization": null,
  "artifactDelta": {},
  "stateDelta": {},
  "transferToAgent": null,
  "requestedAuthConfigs": {},
  "escalate": null
  },
  "customMetadata": null
  }
  ],
  "userId": "USER_ID",
  "lastUpdateTime": 1756490419.7879109,
  "state": {},
  "appName": "1927404301072728064"
  }
  }

- Delete a session:
  curl \  
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/vertexai-469617/locations/us-central1/reasoningEngines/1927404301072728064:query -d '{"class_method": "async_delete_session", "input": {"user_id": "USER_ID", "session_id": "5314034804797210624"},}'
  {
  "output": null
  }

- Stream a response to a query:
  curl \  
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/vertexai-469617/locations/us-central1/reasoningEngines/1927404301072728064:streamQuery\?alt\=sse -d '{
  "class_method": "async_stream_query",
  "input": {
  "user_id": "USER_ID",
  "session_id": "5242399423224348672",
  "message": "What is the exchange rate from US dollars to SEK today?",
  }
  }'
  {"content": {"parts": [{"thought_signature": "CuIEAcu98PB4emlFFb2Zmw3F3XP4RTrm4i9KmtQkiyQdJx2gxRuYAR63VtugbyQbapE9Bo5YTwzoZHQfomWEQifLzkiFKwIh3tOqy4nVqYHOApYBHPRO4OdgKRZ0bikUfKQCwG2aW-GXqxbxzSPzMKAIf-i14rSddEEdd_0OaD7K-2j0AFDhTDBxm2Q7jV_0D0p_UDGhTRa9rK5ueYJrcOO2eSCiFQm0T3CkjZK5_Gmb9pqSBiaTOB5M_25zgdisbmvbEaj4XU9grcdnt9ru7lWoTOsvYZ7_yw8LTEk9v0BqJQL8Pcr9TW9sl9dPc7AuUSDXKIzc3P9X1VQkqvQh4MsxxOXrIU7Rr4AziVnKEZmA5zUfwk867KGCmbad_e6put97-bbL2h71gHEHQq8BoLKLRdndtId7P0vncpqzMbr1cQEDbi2oFEAf6lNhzZZ-35Hqh04lFY-ch5YOf6jpk0G_cl3LuqlrPKqihYZcDq5GPW7frPvDu7D_0o5euhz8poHlgPMlAQl8iN6WcIi8GyKMz9lUSmlhFzKPR3IWsgP-AcyKDpjvZEjgp7vsQmi3KuVV3Jbmsrvez48CkoRMJGPgzWNnnbQjX-GzLrtNiwqNs_FGzpQt6_7l-WXr1YTbSnl40O9IjBpzP7hzWdjEwLIznuqrPdJUN2HUoFbekMglx14-h8FiREqzsjmej0Qzlw04X74lwaiLFw9Dl4Ykck3TLabyvrggp1iJaBfRDpNzTA58KlPk-0YJPP4Su_Jqk3VwZ2GwYkXRw9NwFHJFq2427hItaS0Fxu_urfja2weuaMNpnA==", "text": "I apologize, but I cannot provide real-time exchange rates as my knowledge base is not updated in real-time. Exchange rates fluctuate constantly throughout the day.\n\nTo get the most accurate and up-to-date exchange rate from US dollars to SEK (Swedish Krona), I recommend checking a reliable financial news website, a currency exchange website, or your bank's current exchange rate."}], "role": "model"}, "finish_reason": "STOP", "usage_metadata": {"candidates_token_count": 79, "candidates_tokens_details": [{"modality": "TEXT", "token_count": 79}], "prompt_token_count": 476, "prompt_tokens_details": [{"modality": "TEXT", "token_count": 476}], "thoughts_token_count": 119, "total_token_count": 674, "traffic_type": "ON_DEMAND"}, "invocation_id": "e-4d5e01a3-216f-44bb-8ec6-1dfd7b3e9644", "author": "orchestrator_agent", "actions": {"state_delta": {}, "artifact_delta": {}, "requested_auth_configs": {}}, "id": "dd8d4582-d1e9-45af-ad0c-3535a08f7d0a", "timestamp": 1756491188.991288}
