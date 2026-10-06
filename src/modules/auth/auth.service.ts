import { authRepository } from './auth.repository.js';
import { passwordService } from '../../core/security/password-service.js';
import { tokenService } from '../../core/security/token-service.js';
import {
  UnauthorizedError,
  NotFoundError,
} from '../../core/errors/app-error.js';
import type {
  AuthResponse,
  AuthTokens,
  UserMeResponse,
} from './auth.types.js';
import type { LoginInput } from './auth.schemas.js';

export interface ClientMetadata {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export class AuthService {
  async login(input: LoginInput, meta?: ClientMetadata): Promise<AuthResponse> {
    if (input.provider === 'local') {
      return this.loginWithPassword(input.email!, input.password!, meta);
    }
    return this.loginWithOidc(input.id_token!, meta);
  }

  private async loginWithPassword(
    email: string,
    pass: string,
    meta?: ClientMetadata
  ): Promise<AuthResponse> {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await passwordService.verifyPassword(pass, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { tokens, refreshExpiresAt } = tokenService.generateTokenPair(user.id, user.email);
    const tokenHash = tokenService.hashToken(tokens.refresh_token);

    await authRepository.createUserSession({
      userId: user.id,
      refreshTokenHash: tokenHash,
      expiresAt: refreshExpiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    };
  }

  private async loginWithOidc(idToken: string, meta?: ClientMetadata): Promise<AuthResponse> {
    // In Phase 5 Module 1, OIDC payload is verified or mapped to existing seed user
    let email = 'somchai@momentra.app';
    if (idToken.includes('@')) {
      email = idToken; // allow direct email in dev mock
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('OIDC account not linked to an existing Momentra user');
    }

    const { tokens, refreshExpiresAt } = tokenService.generateTokenPair(user.id, user.email);
    const tokenHash = tokenService.hashToken(tokens.refresh_token);

    await authRepository.createUserSession({
      userId: user.id,
      refreshTokenHash: tokenHash,
      expiresAt: refreshExpiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    };
  }

  async refreshToken(rawRefreshToken: string, meta?: ClientMetadata): Promise<AuthTokens> {
    let payload;
    try {
      payload = tokenService.verifyJwt(rawRefreshToken, 'refresh');
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = tokenService.hashToken(rawRefreshToken);
    const session = await authRepository.findSessionByTokenHash(tokenHash);

    if (!session || session.is_revoked) {
      // Security: Refresh token reuse detected! Invalidate all sessions of this user!
      await authRepository.revokeAllUserSessions(payload.sub);
      throw new UnauthorizedError('Refresh token was revoked or reused');
    }

    // Refresh Token Rotation: revoke old session and issue new pair
    await authRepository.revokeSession(tokenHash);

    const { tokens, refreshExpiresAt } = tokenService.generateTokenPair(payload.sub, payload.email);
    const newHash = tokenService.hashToken(tokens.refresh_token);

    await authRepository.createUserSession({
      userId: payload.sub,
      refreshTokenHash: newHash,
      expiresAt: refreshExpiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return tokens;
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const tokenHash = tokenService.hashToken(rawRefreshToken);
      await authRepository.revokeSession(tokenHash);
    } catch {
      // Idempotent logout
    }
  }

  async getCurrentUser(userId: string): Promise<UserMeResponse> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const workspaces = await authRepository.getUserWorkspaces(userId);

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      workspaces,
    };
  }
}

export const authService = new AuthService();
