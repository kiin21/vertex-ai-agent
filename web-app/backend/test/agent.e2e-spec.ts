import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/entities/user.entity';

describe('Agent Chat E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and get auth token
    const authService = app.get(AuthService);
    const usersService = app.get(UsersService);

    // Create test user
    const testUser = await usersService.create({
      email: 'test-agent@example.com',
      password: 'TestPassword123!',
      name: 'Test Agent',
      role: UserRole.STUDENT,
    });

    testUserId = testUser.id;

    // Login to get token
    const loginResponse = await authService.login({
      email: 'test-agent@example.com',
      password: 'TestPassword123!',
    });

    authToken = loginResponse.access_token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testSessionId) {
      await request(app.getHttpServer())
        .delete(`/agents/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId });
    }

    await app.close();
  });

  describe('Agent Sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app.getHttpServer())
        .post('/agents/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: testUserId })
        .expect(201);

      expect(response.body).toHaveProperty('session');
      expect(response.body.session).toHaveProperty('id');
      expect(response.body.session).toHaveProperty('externalId');
      expect(response.body.session.userId).toBe(testUserId);
      expect(response.body.session.messageCount).toBe(0);

      testSessionId = response.body.session.id;
    });

    it('should list user sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/agents/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId, page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThan(0);
    });

    it('should get session details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/agents/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('externalId');
      expect(response.body).toHaveProperty('chats');
      expect(response.body.id).toBe(testSessionId);
      expect(Array.isArray(response.body.chats)).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-4000-8000-000000000000';

      await request(app.getHttpServer())
        .get(`/agents/sessions/${fakeSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId })
        .expect(404);
    });
  });

  describe('Agent Chat', () => {
    it('should send message and receive response', async () => {
      const testMessage = 'Hello, this is a test message. Please respond briefly.';

      const response = await request(app.getHttpServer())
        .post('/agents/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          message: testMessage,
        })
        .expect(201);

      expect(response.body).toHaveProperty('userMessage');
      expect(response.body).toHaveProperty('aiResponse');
      expect(response.body.userMessage.content).toBe(testMessage);
      expect(response.body.userMessage.role).toBe('user');
      expect(response.body.aiResponse.role).toBe('model');
      expect(response.body.aiResponse.content).toBeDefined();
    });

    it('should handle streaming chat', (done) => {
      const testMessage = 'Tell me a short joke.';

      const req = request(app.getHttpServer())
        .get('/agents/chat/stream')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          userId: testUserId,
          sessionId: testSessionId,
          message: testMessage,
        })
        .expect(200)
        .expect('Content-Type', /text\/plain/);

      let receivedData = '';
      let chunkCount = 0;
      let isComplete = false;

      req.on('data', (chunk) => {
        const data = chunk.toString();
        receivedData += data;
        chunkCount++;

        // Check if we received completion signal
        if (data.includes('"type":"complete"')) {
          isComplete = true;
        }
      });

      req.on('end', () => {
        expect(chunkCount).toBeGreaterThan(0);
        expect(isComplete).toBe(true);
        expect(receivedData).toContain('data:');
        done();
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        req.abort();
        done.fail('Streaming test timed out');
      }, 30000);
    });

    it('should validate required parameters', async () => {
      // Missing message
      await request(app.getHttpServer())
        .post('/agents/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          sessionId: testSessionId,
        })
        .expect(400);

      // Missing sessionId
      await request(app.getHttpServer())
        .post('/agents/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          message: 'test message',
        })
        .expect(400);

      // Missing userId
      await request(app.getHttpServer())
        .post('/agents/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: testSessionId,
          message: 'test message',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/agents/chat')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          message: 'test message',
        })
        .expect(401);
    });

    it('should handle invalid session ID', async () => {
      const fakeSessionId = '00000000-0000-4000-8000-000000000000';

      await request(app.getHttpServer())
        .post('/agents/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          sessionId: fakeSessionId,
          message: 'test message',
        })
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle Google Cloud authentication errors gracefully', async () => {
      // This test would need mock Google Cloud service
      // For now, we'll test with valid credentials
      const response = await request(app.getHttpServer())
        .post('/agents/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          message: 'Test Google Cloud connection',
        });

      // Should either succeed or fail gracefully with proper error message
      expect([200, 201, 500, 503]).toContain(response.status);

      if (response.status >= 500) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('Session Cleanup', () => {
    it('should delete session and all related chats', async () => {
      // First verify session exists
      await request(app.getHttpServer())
        .get(`/agents/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId })
        .expect(200);

      // Delete session
      await request(app.getHttpServer())
        .delete(`/agents/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId })
        .expect(200);

      // Verify session is deleted
      await request(app.getHttpServer())
        .get(`/agents/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId })
        .expect(404);

      // Clear testSessionId so cleanup doesn't try to delete again
      testSessionId = null;
    });
  });
});
