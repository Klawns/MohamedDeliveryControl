import type { Request } from 'express';
import type { UserResponseDto } from './dto/auth.dto';
import type { GoogleOAuthFlowRecord } from './google-oauth-state.service';
import type { User } from '../users/interfaces/users-repository.interface';

export type AuthenticatedUser = Omit<User, 'password'>;

export interface JwtRequestUser {
  id: string;
  role: 'admin' | 'user';
}

export interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponseDto;
}

export interface GoogleUserProfile {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  accessToken: string;
}

export type RequestWithUser = Request & {
  user: JwtRequestUser;
};

export type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies: Record<string, string | undefined>;
};

export type GoogleOAuthRequest = Request & {
  user: GoogleUserProfile;
  googleOAuthFlow?: GoogleOAuthFlowRecord;
};
