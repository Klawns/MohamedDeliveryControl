import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import * as bcrypt from 'bcrypt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../database/database.provider';
import * as schema from '@mdc/database';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private refreshTokenService: RefreshTokenService,
        private subscriptionsService: SubscriptionsService,
        @Inject(DRIZZLE)
        private db: LibSQLDatabase<typeof schema>,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const subscription = user.role !== 'admin'
            ? await this.subscriptionsService.findByUserId(user.id)
            : null;

        const now = new Date();
        const isExpired = subscription?.validUntil ? new Date(subscription.validUntil) < now : false;

        const payload = {
            email: user.email,
            sub: user.id,
            name: user.name,
            role: user.role,
            taxId: user.taxId,
            cellphone: user.cellphone,
            hasSeenTutorial: user.hasSeenTutorial,
            subscription: subscription ? {
                plan: subscription.plan,
                status: isExpired ? 'expired' : subscription.status,
                validUntil: subscription.validUntil,
                rideCount: subscription.rideCount || 0,
            } : null
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.refreshTokenService.create(user.id);

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
                subscription: payload.subscription
            },
        };
    }

    async refresh(oldToken: string) {
        const refreshTokenData = await this.refreshTokenService.validate(oldToken);
        const user = await this.usersService.findById(refreshTokenData.userId);

        if (!user) {
            throw new UnauthorizedException();
        }

        const subscription = user.role !== 'admin'
            ? await this.subscriptionsService.findByUserId(user.id)
            : null;

        const now = new Date();
        const isExpired = subscription?.validUntil ? new Date(subscription.validUntil) < now : false;

        const payload = {
            email: user.email,
            sub: user.id,
            name: user.name,
            role: user.role,
            taxId: user.taxId,
            cellphone: user.cellphone,
            hasSeenTutorial: user.hasSeenTutorial,
            subscription: subscription ? {
                plan: subscription.plan,
                status: isExpired ? 'expired' : subscription.status,
                validUntil: subscription.validUntil,
                rideCount: subscription.rideCount || 0,
            } : null
        };

        const accessToken = this.jwtService.sign(payload);
        const newRefreshToken = await this.refreshTokenService.create(user.id);

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
        console.log('[AuthService] Google Profile recebido:', JSON.stringify(profile));
        const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        let user = await this.usersService.findByEmail(profile.email);

        if (!user) {
            console.log('[AuthService] Criando novo usuário via Google:', profile.email, 'Nome:', fullName);
            user = await this.usersService.create({
                email: profile.email,
                name: fullName,
                password: '', // Sem senha para usuários social
            });
            await this.subscriptionsService.updateOrCreate(user.id, 'starter');
        } else {
            console.log('[AuthService] Usuário Google encontrado no banco:', user.email, 'ID:', user.id, 'Nome atual:', user.name);
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
        const user = await this.usersService.findById(userId);
        return this.login(user);
    }

    async tutorialSeen(userId: string) {
        await this.usersService.update(userId, { hasSeenTutorial: true });
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

    async getLatestProfile(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) return null;

        const subscription = user.role !== 'admin'
            ? await this.subscriptionsService.findByUserId(user.id)
            : null;

        const realRideCount = user.role !== 'admin'
            ? await this.db
                .select({ count: sql<number>`count(*)` })
                .from(schema.rides)
                .where(eq(schema.rides.userId, userId))
                .then(res => Number(res[0]?.count || 0))
            : 0;

        const now = new Date();
        const isExpired = subscription?.validUntil ? new Date(subscription.validUntil) < now : false;

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            taxId: user.taxId,
            cellphone: user.cellphone,
            hasSeenTutorial: user.hasSeenTutorial,
            subscription: subscription ? {
                plan: subscription.plan,
                status: isExpired ? 'expired' : subscription.status,
                validUntil: subscription.validUntil,
                rideCount: realRideCount,
            } : null
        };
    }
}
