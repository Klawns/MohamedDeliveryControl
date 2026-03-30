import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Get,
  UseGuards,
  Patch,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { CookieOptions, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { ZodBody } from '../common/decorators/zod.decorator';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  profileSchema,
  userResponseSchema,
} from './dto/auth.dto';
import type {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ProfileDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleCallbackGuard } from './guards/google-callback.guard';
import { ConfigService } from '@nestjs/config';
import type {
  AuthTokensResponse,
  GoogleOAuthRequest,
  RequestWithCookies,
  RequestWithUser,
} from './auth.types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly accessTokenCookieMaxAgeMs = 8 * 60 * 60 * 1000;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions(): CookieOptions {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      Boolean(frontendUrl?.includes('up.railway.app'));

    // Logs de depuração (aparecerão no Railway Logs)
    this.logger.log(
      `Configurando cookies. Prod: ${isProduction}, Frontend: ${frontendUrl}`,
    );

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      domain: this.configService.get('COOKIE_DOMAIN') || undefined,
      path: '/',
    };
  }

  private setAuthCookies(
    res: Response,
    tokens: AuthTokensResponse,
    isAdmin = false,
  ) {
    const cookieOptions = this.getCookieOptions();
    const refreshCookieName = isAdmin ? 'admin_refresh_token' : 'refresh_token';
    const accessCookieName = isAdmin ? 'admin_access_token' : 'access_token';

    res.cookie(refreshCookieName, tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.cookie(accessCookieName, tokens.access_token, {
      ...cookieOptions,
      maxAge: this.accessTokenCookieMaxAgeMs,
    });
  }

  private getFrontendUrl() {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    );
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  async googleAuthRedirect(
    @Req() req: GoogleOAuthRequest,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.validateGoogleUser(
      req.user,
      req.googleOAuthFlow?.cellphone,
    );
    if (!tokens.user) {
      throw new UnauthorizedException('Falha ao carregar o perfil do usuário.');
    }
    this.setAuthCookies(res, tokens);

    const cookieOptions = this.getCookieOptions();
    res.clearCookie('selected_plan', cookieOptions);
    const selectedPlan = req.googleOAuthFlow?.plan || 'starter';

    const subscription = await this.authService.getUserSubscription(
      tokens.user.id,
    );
    const frontendUrl = this.getFrontendUrl();

    if (
      ['premium', 'lifetime'].includes(selectedPlan) &&
      (!subscription || subscription.plan === 'starter')
    ) {
      return res.redirect(`${frontendUrl}/contato`);
    }

    return res.redirect(`${frontendUrl}/dashboard`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    const profile = await this.authService.getLatestProfile(req.user.id);
    this.logger.log(`Buscando perfil para user ID: ${req.user.id}.`);
    return userResponseSchema.parse(profile);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req: RequestWithUser,
    @ZodBody(changePasswordSchema) body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: RequestWithUser,
    @ZodBody(profileSchema) body: ProfileDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.updateProfile(req.user.id, body);
    this.setAuthCookies(res, tokens);

    return {
      user: tokens.user,
    };
  }

  @Public()
  @Post('login')
  @Throttle({ sensitive: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @ZodBody(loginSchema) body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.authService.login(user);
    this.setAuthCookies(res, tokens, user.role === 'admin');

    // Task 3.2 Phase 2: Whitelisting output via DTO
    return {
      user: userResponseSchema.parse(tokens.user),
    };
  }

  @Public()
  @Post('register')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  async register(
    @ZodBody(registerSchema) body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(body);
    this.setAuthCookies(res, tokens);

    // Task 3.2 Phase 2: Whitelisting output via DTO
    return {
      user: userResponseSchema.parse(tokens.user),
    };
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isAdmin = !!req.cookies['admin_refresh_token'];
    const refreshTokenName = isAdmin ? 'admin_refresh_token' : 'refresh_token';

    const token = req.cookies[refreshTokenName];
    if (!token) {
      throw new UnauthorizedException();
    }
    const tokens = await this.authService.refresh(token);
    this.setAuthCookies(res, tokens, isAdmin);

    return { success: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieOptions = this.getCookieOptions();

    // Pega os tokens antes de limpar, pra podermos invalidar no Redis
    const refreshToken = req.cookies['refresh_token'];
    const adminRefreshToken = req.cookies['admin_refresh_token'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    if (adminRefreshToken) {
      await this.authService.logout(adminRefreshToken);
    }

    res.clearCookie('refresh_token', cookieOptions);
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('admin_refresh_token', cookieOptions);
    res.clearCookie('admin_access_token', cookieOptions);
  }
}
