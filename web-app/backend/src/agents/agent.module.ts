import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentService, VertexAiService } from './services';
import { AgentSession, AgentChat } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentSession, AgentChat]),
    ConfigModule,
  ],
  controllers: [AgentController],
  providers: [AgentService, VertexAiService],
  exports: [AgentService, VertexAiService],
})
export class AgentModule { }
