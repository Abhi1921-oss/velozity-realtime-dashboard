import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { AuthenticatedRequest, AuthUser } from '../types';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 mins
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateTokens = (user: { id: string; email: string; role: any; name: string }) => {
  const payload: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials provided.', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials provided.', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Hash refresh token before saving in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    // Store refresh token strictly in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      res.status(401).json({
        success: false,
        error: { message: 'Refresh token missing in HttpOnly cookie.', code: 'NO_REFRESH_TOKEN' },
      });
      return;
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(incomingRefreshToken, config.jwt.refreshSecret) as { id: string };
    } catch {
      res.status(401).json({
        success: false,
        error: { message: 'Refresh token expired or invalid.', code: 'INVALID_REFRESH_TOKEN' },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.refreshTokenHash) {
      res.status(401).json({
        success: false,
        error: { message: 'Session expired or invalidated. Please login again.', code: 'SESSION_REVOKED' },
      });
      return;
    }

    const isMatch = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!isMatch) {
      // Possible token reuse attack detected: clear token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.status(403).json({
        success: false,
        error: { message: 'Refresh token reuse detected. Access revoked.', code: 'TOKEN_REUSE' },
      });
      return;
    }

    // Token rotation: Issue new access & refresh token
    const tokens = generateTokens(user);
    const newHash = await bcrypt.hash(tokens.refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newHash },
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshTokenHash: null },
      });
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });

    res.status(200).json({
      success: true,
      data: { message: 'Successfully logged out.' },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthenticated', code: 'UNAUTHENTICATED' },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
