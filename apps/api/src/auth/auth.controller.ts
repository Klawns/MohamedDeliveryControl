import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, Req, Res, UsePipes, Get, UseGuards, Patch, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { loginSchema, registerSchema, changePasswordSchema, profileSchema } from './dto/auth.dto';
import type { LoginDto, RegisterDto, ChangePasswordDto, ProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) { }

    private getCookieOptions() {
        const frontendUrl = this.configService.get('FRONTEND_URL');
        const isProduction = process.env.NODE_ENV === 'production' || frontendUrl?.includes('up.railway.app');

        // Logs de depuração (aparecerão no Railway Logs)
        this.logger.log(`Configurando cookies. Prod: ${isProduction}, Frontend: ${frontendUrl}`);

        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax' as any,
            path: '/',
            partitioned: isProduction, // CRITICAL: Permite cookies em subdomínios cruzados do Railway
        };
    }

    private getFrontendUrl() {
        return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth(@Req() req: any) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        const tokens = await this.authService.validateGoogleUser(req.user);
        const cookieOptions = this.getCookieOptions();

        res.cookie('refresh_token', tokens.refresh_token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie('access_token', tokens.access_token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        const selectedPlan = req.cookies['selected_plan'] || 'starter';
        res.clearCookie('selected_plan', cookieOptions);

        const subscription = await this.authService.getUserSubscription(tokens.user.id);
        const frontendUrl = this.getFrontendUrl();

        if (['premium', 'lifetime'].includes(selectedPlan) && (!subscription || subscription.plan === 'starter')) {
            return res.redirect(`${frontendUrl}/checkout?plan=${selectedPlan}`);
        }

        return res.redirect(`${frontendUrl}/dashboard`);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Req() req: any) {
        this.logger.log(`Buscando perfil para user ID: ${req.user.id}`);
        return this.authService.getLatestProfile(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    @UsePipes(new ZodValidationPipe(changePasswordSchema))
    async changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    @UsePipes(new ZodValidationPipe(profileSchema))
    async updateProfile(@Req() req: any, @Body() body: ProfileDto, @Res({ passthrough: true }) res: Response) {
        const tokens = await this.authService.updateProfile(req.user.id, body);
        const cookieOptions = this.getCookieOptions();

        res.cookie('refresh_token', tokens.refresh_token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie('access_token', tokens.access_token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        return {
            user: tokens.user,
        };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ZodValidationPipe(loginSchema))
    async login(@Req() req: Request, @Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        if (user.role !== 'admin') {
            throw new UnauthorizedException('Acesso restrito para administradores por este meio. Por favor, utilize o Login com Google.');
        }

        const tokens = await this.authService.login(user);
        const cookieOptions = this.getCookieOptions();

        res.cookie('admin_refresh_token', tokens.refresh_token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie('admin_access_token', tokens.access_token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        return {
            user: tokens.user,
        };
    }

    @Post('register')
    @UsePipes(new ZodValidationPipe(registerSchema))
    async register(@Req() req: Request, @Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const tokens = await this.authService.register(body);
        const cookieOptions = this.getCookieOptions();

        res.cookie('refresh_token', tokens.refresh_token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie('access_token', tokens.access_token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        return {
            user: tokens.user,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const isAdmin = !!req.cookies['admin_refresh_token'];
        const refreshTokenName = isAdmin ? 'admin_refresh_token' : 'refresh_token';
        const accessTokenName = isAdmin ? 'admin_access_token' : 'access_token';

        const token = req.cookies[refreshTokenName];
        if (!token) {
            throw new UnauthorizedException();
        }
        const tokens = await this.authService.refresh(token);
        const cookieOptions = this.getCookieOptions();

        res.cookie(refreshTokenName, tokens.refresh_token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie(accessTokenName, tokens.access_token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        return { success: true };
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Res({ passthrough: true }) res: Response) {
        const cookieOptions = this.getCookieOptions();
        res.clearCookie('refresh_token', cookieOptions);
        res.clearCookie('access_token', cookieOptions);
        res.clearCookie('admin_refresh_token', cookieOptions);
        res.clearCookie('admin_access_token', cookieOptions);
    }
}
