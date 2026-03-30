/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Jest mocks in this spec intentionally use partial runtime stubs. */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let authServiceMock: {
    validateUser: jest.Mock;
    login: jest.Mock;
    register: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authServiceMock = {
      validateUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return login success', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        role: 'admin',
        name: 'Test User',
        hasSeenTutorial: false,
      };
      const loginResponse = {
        access_token: 'token',
        refresh_token: 'refresh-token',
        user,
      };

      (authService.validateUser as jest.Mock).mockResolvedValue(user);
      (authService.login as jest.Mock).mockResolvedValue(loginResponse);

      const mockRes = {
        cookie: jest.fn(),
        json: jest.fn().mockImplementation((val) => val),
      };
      const result = await controller.login(
        { email: 'test@test.com', password: 'password' },
        mockRes as any,
      );

      expect(mockRes.cookie).toHaveBeenNthCalledWith(
        1,
        'admin_refresh_token',
        'refresh-token',
        expect.objectContaining({
          maxAge: 15 * 24 * 60 * 60 * 1000,
        }),
      );
      expect(mockRes.cookie).toHaveBeenNthCalledWith(
        2,
        'admin_access_token',
        'token',
        expect.objectContaining({
          maxAge: 8 * 60 * 60 * 1000,
        }),
      );
      expect(result).toEqual({ user });
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      const mockRes = { cookie: jest.fn(), json: jest.fn() }; // Added mockRes definition for context
      await expect(
        controller.login(
          { email: 'test@test.com', password: 'wrong' },
          mockRes as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke refresh tokens found in cookies and clear auth cookies', async () => {
      const mockReq = {
        cookies: {
          refresh_token: 'refresh-token',
          admin_refresh_token: 'admin-refresh-token',
        },
      };
      const mockRes = {
        clearCookie: jest.fn(),
      };

      await controller.logout(mockReq as any, mockRes as any);

      expect(authServiceMock.logout).toHaveBeenCalledTimes(2);
      expect(authServiceMock.logout).toHaveBeenNthCalledWith(
        1,
        'refresh-token',
      );
      expect(authServiceMock.logout).toHaveBeenNthCalledWith(
        2,
        'admin-refresh-token',
      );
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(4);
    });
  });
});
