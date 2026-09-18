import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput, LoginInput } from '@flirty/validation';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput, meta?: { userAgent?: string; ip?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        phone: input.phone,
        phoneCountry: input.phoneCountry,
        profile: { create: {} },
        preferences: { create: {} },
        entitlementWallet: { create: {} },
      },
    });

    return this.issueTokens(user.id, user.email, user.role, meta);
  }

  async login(input: LoginInput, meta?: { userAgent?: string; ip?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user || user.status === 'DELETED') {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role, meta);
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    const hash = hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: hash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!session || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(
      session.user.id,
      session.user.email,
      session.user.role,
      meta,
    );
  }

  async logout(refreshToken: string) {
    const hash = hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshHash = hashToken(refreshToken);
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '30d');
    const expiresAt = addDuration(new Date(), refreshTtl);

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: refreshHash,
        userAgent: meta?.userAgent,
        ip: meta?.ip,
        expiresAt,
      },
    });

    const payload: JwtPayload = {
      sub: userId,
      email,
      role: role as JwtPayload['role'],
      sid: session.id,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as `${number}m` | `${number}d` | `${number}h` | `${number}s`,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
      tokenType: 'Bearer',
      user: { id: userId, email, role },
    };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function addDuration(from: Date, ttl: string): Date {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) {
    // default 30 days
    return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  const n = Number(match[1]);
  const unit = match[2];
  const ms =
    unit === 's'
      ? n * 1000
      : unit === 'm'
        ? n * 60 * 1000
        : unit === 'h'
          ? n * 60 * 60 * 1000
          : n * 24 * 60 * 60 * 1000;
  return new Date(from.getTime() + ms);
}
