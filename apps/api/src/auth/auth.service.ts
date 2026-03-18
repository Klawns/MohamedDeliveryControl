import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import * as bcrypt from 'bcrypt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { IRidesRepository } from '../rides/interfaces/rides-repository.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private subscriptionsService: SubscriptionsService,
    @Inject(IRidesRepository)
    private ridesRepository: IRidesRepository,
    @Inject(CACHE_PROVIDER)
    private cache: ICacheProvider,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  private async buildUserPayload(user: any) {
    const subscription =
      user.role !== 'admin'
        ? await this.subscriptionsService.findByUserId(user.id)
        : null;

    const realRideCount =
      user.role !== 'admin' ? await this.ridesRepository.countAll(user.id) : 0;

    const now = new Date();
    const isExpired = subscription?.validUntil
      ? new Date(subscription.validUntil) < now
      : false;

    return {
      email: user.email,
      sub: user.id,
      name: user.name,
      role: user.role,
      taxId: user.taxId,
      cellphone: user.cellphone,
      hasSeenTutorial: user.hasSeenTutorial,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: isExpired ? 'expired' : subscription.status,
            validUntil: subscription.validUntil,
            rideCount: realRideCount,
          }
        : null,
    };
  }

  async login(user: any) {
    const payload = await this.buildUserPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.create(user.id);

    console.log(
      `[AuthService] Login realizado com sucesso para: ${user.email}. Role: ${user.role}`,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        taxId: user.taxId,
        cellphone: user.cellphone,
        subscription: payload.subscription,
      },
    };
  }

  async refresh(oldToken: string) {
    const refreshTokenData = await this.refreshTokenService.validate(oldToken);
    const user = await this.usersService.findById(refreshTokenData.userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = await this.buildUserPayload(user);

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.refreshTokenService.create(user.id);

    console.log(
      `[AuthService] Refresh realizado com sucesso para: ${user.email}. Role: ${user.role}`,
    );

    // Rotação: revogar o token antigo imediatamente após o uso
    await this.refreshTokenService.revoke(oldToken);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });
    await this.subscriptionsService.updateOrCreate(user.id, 'starter');
    return this.login(user);
  }

  async validateGoogleUser(profile: any) {
    console.log(
      '[AuthService] Google Profile recebido:',
      JSON.stringify(profile),
    );
    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(' ');
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      console.log(
        '[AuthService] Criando novo usuário via Google:',
        profile.email,
        'Nome:',
        fullName,
      );
      user = await this.usersService.create({
        email: profile.email,
        name: fullName,
        password: '', // Sem senha para usuários social
      });
      await this.subscriptionsService.updateOrCreate(user.id, 'starter');
    } else {
      console.log(
        '[AuthService] Usuário Google encontrado no banco:',
        user.email,
        'ID:',
        user.id,
        'Nome atual:',
        user.name,
      );
      if (user.name && user.name.endsWith(' undefined')) {
        const cleanedName = user.name.replace(' undefined', '').trim();
        await this.usersService.update(user.id, { name: cleanedName });
        user.name = cleanedName;
      }
    }

    return this.login(user);
  }

  async getUserSubscription(userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  async updateProfile(userId: string, data: any) {
    await this.usersService.update(userId, data);
    await this.cache.del(`profile:${userId}`); // Invalida o cache
    const user = await this.usersService.findById(userId);
    return this.login(user);
  }

  async tutorialSeen(userId: string) {
    await this.usersService.update(userId, { hasSeenTutorial: true });
    await this.cache.del(`profile:${userId}`); // Invalida o cache do perfil
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
      await this.refreshTokenService.revoke(refreshToken);
    }
    return { message: 'Logout realizado' };
  }

  async getLatestProfile(userId: string) {
    const cacheKey = `profile:${userId}`;

    // 1. Tenta carregar do Redis
    const cachedProfile = await this.cache.get<any>(cacheKey);
    if (cachedProfile) {
      return cachedProfile;
    }

    // 2. Busca do Banco (Turso)
    const user = await this.usersService.findById(userId);
    if (!user) return null;

    const finalProfile = await this.buildUserPayload(user);
    // Adiciona o id ao perfil retornado, pois o buildUserPayload o nomeia como "sub" no JWT
    Object.assign(finalProfile, { id: user.id });

    // 3. Guarda e expira naturalmente em 10 minutos (Dá espaço para não quebrar a sincronização)
    await this.cache.set(cacheKey, finalProfile, 600);

    return finalProfile;
  }
}
