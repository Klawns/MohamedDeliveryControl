import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [DebugController],
})
export class DebugModule {}
