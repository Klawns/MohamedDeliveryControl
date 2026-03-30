import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';
import type { User } from '../users/interfaces/users-repository.interface';
import { AuthProfileService } from './auth-profile.service';
import type { ProfileDto, RegisterDto, UserResponseDto } from './dto/auth.dto';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import type {
  AuthenticatedUser,
  AuthTokensResponse,
  GoogleUserProfile,
} from './auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly authProfileService: AuthProfileService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      void password;
      return result;
    }

    return null;
  }

  private buildUserPayload(user: Pick<User, 'id' | 'role'>) {
    return {
      sub: user.id,
      role: user.role,
    };
  }

  async login(user: Pick<User, 'id' | 'role'>): Promise<AuthTokensResponse> {
    const payload = this.buildUserPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.create(user.id);
    const profile = await this.authProfileService.getRequiredProfile(user.id);

    this.logger.log(
      `Login realizado com sucesso para usuário ID: ${user.id}. Role: ${user.role}`,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: profile,
    };
  }

  async refresh(oldToken: string): Promise<AuthTokensResponse> {
    const refreshTokenData =
      await this.refreshTokenService.validateAndRevoke(oldToken);
    const user = await this.usersService.findById(refreshTokenData.userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = this.buildUserPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.refreshTokenService.create(
      user.id,
      refreshTokenData.familyId,
    );

    this.logger.log(
      `Refresh realizado com sucesso para usuário ID: ${user.id}. Session: ${refreshTokenData.familyId}`,
    );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user: await this.authProfileService.getRequiredProfile(user.id),
    };
  }

  async register(data: RegisterDto): Promise<AuthTokensResponse> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    await this.subscriptionsService.updateOrCreate(user.id, 'starter');

    return this.login(user);
  }

  async validateGoogleUser(
    profile: GoogleUserProfile,
    cellphone?: string,
  ): Promise<AuthTokensResponse> {
    this.logger.debug('Google Profile recebido', { profile });

    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(' ');
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      this.logger.log('Criando novo usuário via Google');
      user = await this.usersService.create({
        email: profile.email,
        name: fullName,
        password: '',
        ...(cellphone ? { cellphone } : {}),
      });
      await this.subscriptionsService.updateOrCreate(user.id, 'starter');
    } else {
      this.logger.log('Usuário Google encontrado e autenticado');

      const updates: Partial<User> = {};

      if (user.name && user.name.endsWith(' undefined')) {
        updates.name = user.name.replace(' undefined', '').trim();
      }

      if (cellphone && !user.cellphone) {
        updates.cellphone = cellphone;
      }

      if (Object.keys(updates).length > 0) {
        await this.usersService.update(user.id, updates);
        user = {
          ...user,
          ...updates,
        };
      }
    }

    return this.login(user);
  }

  async getUserSubscription(userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  async updateProfile(
    userId: string,
    data: ProfileDto,
  ): Promise<AuthTokensResponse> {
    await this.usersService.update(userId, data);
    await this.authProfileService.invalidateProfile(userId);

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return this.login(user);
  }

  async tutorialSeen(userId: string) {
    await this.usersService.update(userId, { hasSeenTutorial: true });
    await this.authProfileService.invalidateProfile(userId);
    return { success: true };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !(await bcrypt.compare(currentPass, user.password))) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await this.usersService.update(userId, { password: hashedNewPassword });

    return { message: 'Senha alterada com sucesso' };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      try {
        await this.refreshTokenService.revoke(refreshToken);
      } catch (error: unknown) {
        this.logger.error(
          `Falha ao revogar token no logout: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
        );
      }
    }

    return { message: 'Logout realizado' };
  }

  async getLatestProfile(userId: string): Promise<UserResponseDto | null> {
    return this.authProfileService.getLatestProfile(userId);
  }
}
