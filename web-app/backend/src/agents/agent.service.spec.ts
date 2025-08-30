import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentService } from './services/agent.service';
import { VertexAiService } from './services/vertex-ai.service';
import { AgentSession, AgentChat } from './entities';
import { CreateSessionDto } from './dto';

// Mock repositories
const mockSessionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockChatRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

// Mock VertexAI service
const mockVertexAiService = {
  createSession: jest.fn(),
  listSessions: jest.fn(),
  getSession: jest.fn(),
  deleteSession: jest.fn(),
  streamQuery: jest.fn(),
};

describe('AgentService', () => {
  let service: AgentService;
  let sessionRepository: Repository<AgentSession>;
  let vertexAiService: VertexAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: getRepositoryToken(AgentSession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(AgentChat),
          useValue: mockChatRepository,
        },
        {
          provide: VertexAiService,
          useValue: mockVertexAiService,
        },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    sessionRepository = module.get<Repository<AgentSession>>(
      getRepositoryToken(AgentSession),
    );
    vertexAiService = module.get<VertexAiService>(VertexAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const createSessionDto: CreateSessionDto = {
        userId: 'user123',
      };

      const mockExternalResponse = {
        output: {
          id: 'external-session-123',
          lastUpdateTime: 1756490954.9925039,
          state: {},
          appName: 'test-app',
          userId: 'user123',
          events: [],
        },
      };

      const mockSavedSession = {
        id: 'local-session-123',
        externalId: 'external-session-123',
        userId: 'user123',
        appName: 'test-app',
        state: 'active',
        sessionMetadata: {},
        lastUpdateTime: 1756490954.9925039,
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVertexAiService.createSession.mockResolvedValue(mockExternalResponse);
      mockSessionRepository.create.mockReturnValue(mockSavedSession);
      mockSessionRepository.save.mockResolvedValue(mockSavedSession);

      const result = await service.createSession(createSessionDto);

      expect(vertexAiService.createSession).toHaveBeenCalledWith('user123');
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: 'local-session-123',
          externalId: 'external-session-123',
          userId: 'user123',
        }),
      );
    });
  });

  describe('listUserSessions', () => {
    it('should list user sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          externalId: 'external-1',
          userId: 'user123',
          appName: 'test-app',
          state: 'active',
          messageCount: 5,
          lastUpdateTime: 1756490954.9925039,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.listUserSessions('user123');

      expect(sessionRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user123', state: 'active' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'session-1',
          userId: 'user123',
        }),
      );
    });
  });
});
