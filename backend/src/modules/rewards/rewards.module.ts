import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardsController } from './rewards.controller';
import { RewardsRepository } from './rewards.repository';
import { RewardsService } from './rewards.service';

@Module({
  imports: [AuthModule],
  controllers: [RewardsController],
  providers: [RewardsService, RewardsRepository],
  exports: [RewardsService],
})
export class RewardsModule {}
