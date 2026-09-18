import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PhotosModule } from './photos/photos.module';
import { PreferencesModule } from './preferences/preferences.module';
import { DiscoverModule } from './discover/discover.module';
import { SwipesModule } from './swipes/swipes.module';
import { MatchesModule } from './matches/matches.module';
import { LikesModule } from './likes/likes.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BlocksModule } from './blocks/blocks.module';
import { ReportsModule } from './reports/reports.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ConsumablesModule } from './consumables/consumables.module';
import { BoostsModule } from './boosts/boosts.module';
import { PassportModule as AppPassportModule } from './passport/passport.module';
import { TopPicksModule } from './top-picks/top-picks.module';
import { FlirtsModule } from './flirts/flirts.module';
import { AdminModule } from './admin/admin.module';
import { RealtimeModule } from './realtime/realtime.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { StorageModule } from './storage/storage.module';
import { BillingModule } from './billing/billing.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '../../.env'),
        join(__dirname, '../../../.env'),
        '.env',
      ],
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    BillingModule,
    EntitlementsModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    PhotosModule,
    PreferencesModule,
    DiscoverModule,
    SwipesModule,
    MatchesModule,
    LikesModule,
    MessagesModule,
    NotificationsModule,
    BlocksModule,
    ReportsModule,
    SubscriptionsModule,
    ConsumablesModule,
    BoostsModule,
    AppPassportModule,
    TopPicksModule,
    FlirtsModule,
    AdminModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
