import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions/api.exception';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { User } from '@prisma/client';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ApiException(
        'EMAIL_ALREADY_IN_USE',
        HttpStatus.CONFLICT,
        'conflict_error',
        [{ field: 'email', code: 'already_in_use', message: dto.email }],
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new ApiException(
        'INVALID_CREDENTIALS',
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new ApiException(
        'INVALID_CREDENTIALS',
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
      );
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new ApiException(
        'INVALID_REFRESH_TOKEN',
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
      );
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenId: string | null = null;
    for (const stored of storedTokens) {
      if (await bcrypt.compare(refreshToken, stored.tokenHash)) {
        matchedTokenId = stored.id;
        break;
      }
    }

    if (!matchedTokenId) {
      throw new ApiException(
        'INVALID_REFRESH_TOKEN',
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new ApiException(
        'INVALID_REFRESH_TOKEN',
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedTokenId },
      data: { revoked: true },
    });

    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
    });

    for (const stored of storedTokens) {
      if (await bcrypt.compare(refreshToken, stored.tokenHash)) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revoked: true },
        });
        break;
      }
    }
  }

  async me(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiException(
        'NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }
    return this.toProfile(user);
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: randomUUID() },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_TOKEN_TTL,
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { accessToken, refreshToken, user: this.toProfile(user) };
  }

  private toProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      memberSince: user.memberSince.toISOString(),
    };
  }
}
