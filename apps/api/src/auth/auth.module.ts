import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthProfileService } from './auth-profile.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleCallbackGuard } from './guards/google-callback.guard';
import { GoogleOAuthStateService } from './google-oauth-state.service';

@Module({
  imports: [
    UsersModule,
    SubscriptionsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>('JWT_SECRET_CURRENT') ||
          config.get<string>('JWT_SECRET');
        const keyid = config.get<string>('JWT_SECRET_CURRENT_ID', 'v1');

        return {
          secret,
          signOptions: {
            expiresIn: '1d',
            issuer: config.get<string>('JWT_ISSUER', 'mohamed-delivery-api'),
            audience: config.get<string>(
              'JWT_AUDIENCE',
              'mohamed-delivery-app',
            ),
            keyid, // Identificador da chave para rotação
          },
        };
      },
    }),
  ],
  providers: [
    AuthProfileService,
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    RefreshTokenService,
    GoogleOAuthStateService,
    GoogleAuthGuard,
    GoogleCallbackGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
