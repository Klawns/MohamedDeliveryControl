import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleUserProfile } from './auth.types';

interface GooglePassportProfile {
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: Array<{ value?: string }>;
  photos?: Array<{ value?: string }>;
}

export function isGoogleOAuthConfigured(configService: ConfigService) {
  return Boolean(
    configService.get<string>('GOOGLE_CLIENT_ID') &&
    configService.get<string>('GOOGLE_CLIENT_SECRET') &&
    configService.get<string>('GOOGLE_CALLBACK_URL'),
  );
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');
    const isConfigured = isGoogleOAuthConfigured(configService);

    super({
      clientID: clientID || 'google-oauth-disabled',
      clientSecret: clientSecret || 'google-oauth-disabled',
      callbackURL: callbackURL || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });

    if (isConfigured) {
      this.logger.log(
        `Inicializando. ID: ${!!clientID}, Secret: ${!!clientSecret}, Callback: ${callbackURL}`,
      );
      return;
    }

    this.logger.warn(
      'Google OAuth está desabilitado. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_CALLBACK_URL para ativá-lo.',
    );
  }

  validate(
    accessToken: string,
    _refreshToken: string,
    profile: GooglePassportProfile,
    done: VerifyCallback,
  ): void {
    const user: GoogleUserProfile = {
      email: profile.emails?.[0]?.value ?? '',
      firstName: profile.name?.givenName ?? '',
      lastName: profile.name?.familyName ?? '',
      picture: profile.photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
