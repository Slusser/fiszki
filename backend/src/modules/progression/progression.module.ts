import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProgressionController } from './progression.controller';
import { ProgressionRepository } from './progression.repository';
import { ProgressionService } from './progression.service';

@Module({
  imports: [AuthModule],
  controllers: [ProgressionController],
  providers: [ProgressionService, ProgressionRepository],
  exports: [ProgressionService],
})
export class ProgressionModule {}
