import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';
import { CatalogController } from './catalog.controller';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';

@Module({
  imports: [AuthModule, RewardsModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogService],
})
export class CatalogModule {}
