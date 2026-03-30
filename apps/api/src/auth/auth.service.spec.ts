import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { AuthProfileService } from './auth-profile.service';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let subscriptionsServiceMock: {
    updateOrCreate: jest.Mock;
  };
  let jwtServiceMock: {
    sign: jest.Mock;
  };
  let refreshTokenServiceMock: {
    create: jest.Mock;
  };
  let authProfileServiceMock: {
    getLatestProfile: jest.Mock;
    getRequiredProfile: jest.Mock;
    invalidateProfile: jest.Mock;
  };

  beforeEach(async () => {
    usersServiceMock = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    subscriptionsServiceMock = {
      updateOrCreate: jest.fn().mockResolvedValue(undefined),
    };
    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('signed-access-token'),
    };
    refreshTokenServiceMock = {
      create: jest.fn().mockResolvedValue('refresh-token'),
    };
    authProfileServiceMock = {
      getLatestProfile: jest.fn(),
      getRequiredProfile: jest.fn(),
      invalidateProfile: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        {
          provide: RefreshTokenService,
          useValue: refreshTokenServiceMock,
        },
        { provide: AuthProfileService, useValue: authProfileServiceMock },
        { provide: SubscriptionsService, useValue: subscriptionsServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate latest profile lookup to AuthProfileService', async () => {
    const profile = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      taxId: '12345678901',
      cellphone: '11999999999',
      hasSeenTutorial: true,
      subscription: null,
      createdAt: new Date('2026-03-27T18:00:00.000Z'),
    };
    authProfileServiceMock.getLatestProfile.mockResolvedValue(profile);

    const result = await service.getLatestProfile('user-1');

    expect(result).toEqual(profile);
    expect(authProfileServiceMock.getLatestProfile).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('should use the complete profile in login responses', async () => {
    authProfileServiceMock.getRequiredProfile.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      taxId: null,
      cellphone: null,
      hasSeenTutorial: false,
      subscription: null,
      createdAt: new Date('2026-03-27T18:00:00.000Z'),
    });

    const result = await service.login({
      id: 'user-1',
      role: 'user',
    });

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      role: 'user',
    });
    expect(result).toMatchObject({
      access_token: 'signed-access-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        hasSeenTutorial: false,
        subscription: null,
      },
    });
  });

  it('should create a google user with cellphone when missing', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(undefined);
    usersServiceMock.create.mockResolvedValue({
      id: 'user-2',
      role: 'user',
    });
    authProfileServiceMock.getRequiredProfile.mockResolvedValue({
      id: 'user-2',
      name: 'Google User',
      email: 'google@example.com',
      role: 'user',
      taxId: null,
      cellphone: '11999999999',
      hasSeenTutorial: false,
      subscription: null,
      createdAt: new Date('2026-03-27T18:00:00.000Z'),
    });

    await service.validateGoogleUser(
      {
        email: 'google@example.com',
        firstName: 'Google',
        lastName: 'User',
        accessToken: 'token',
      },
      '11999999999',
    );

    expect(usersServiceMock.create).toHaveBeenCalledWith({
      email: 'google@example.com',
      name: 'Google User',
      password: '',
      cellphone: '11999999999',
    });
    expect(subscriptionsServiceMock.updateOrCreate).toHaveBeenCalledWith(
      'user-2',
      'starter',
    );
  });

  it('should backfill cellphone for existing google users without one', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-3',
      email: 'google@example.com',
      name: 'Existing User',
      role: 'user',
      cellphone: null,
    });
    authProfileServiceMock.getRequiredProfile.mockResolvedValue({
      id: 'user-3',
      name: 'Existing User',
      email: 'google@example.com',
      role: 'user',
      taxId: null,
      cellphone: '11999999999',
      hasSeenTutorial: false,
      subscription: null,
      createdAt: new Date('2026-03-27T18:00:00.000Z'),
    });

    await service.validateGoogleUser(
      {
        email: 'google@example.com',
        firstName: 'Existing',
        lastName: 'User',
        accessToken: 'token',
      },
      '11999999999',
    );

    expect(usersServiceMock.update).toHaveBeenCalledWith('user-3', {
      cellphone: '11999999999',
    });
  });
});
