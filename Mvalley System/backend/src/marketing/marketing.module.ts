import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { ChannelAccountsController } from './channel-accounts.controller';
import { ChannelAccountsService } from './channel-accounts.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { MetaOAuthController } from './meta/meta-oauth.controller';
import { MetaOAuthService } from './meta/meta-oauth.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    MarketingController,
    ChannelAccountsController,
    CampaignsController,
    ConversationsController,
    MessagesController,
    ParticipantsController,
    MetaOAuthController,
  ],
  providers: [
    MarketingService,
    ChannelAccountsService,
    CampaignsService,
    ConversationsService,
    MessagesService,
    ParticipantsService,
    MetaOAuthService,
  ],
  exports: [
    MarketingService,
    ChannelAccountsService,
    CampaignsService,
    ConversationsService,
    MessagesService,
    ParticipantsService,
    MetaOAuthService,
  ],
})
export class MarketingModule {}



