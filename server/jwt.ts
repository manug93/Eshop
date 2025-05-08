import jwt from 'jsonwebtoken';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export interface TokenPayload {
  userId: number;
  username: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(user: User): Tokens {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export async function refreshTokens(refreshToken: string): Promise<Tokens> {
  try {
    const payload = await verifyRefreshToken(refreshToken);
    const user = await storage.getUser(payload.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return generateTokens(user);
  } catch (error) {
    throw new Error('Failed to refresh tokens');
  }
}

export const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
  },
  async (payload: TokenPayload, done) => {
    try {
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return done(null, false);
      }
      const { password, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }
);

export const googleStrategy = new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID!,
    clientSecret: GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifier si l'utilisateur existe déjà avec cet email
      let user = await storage.getUserByEmail(profile.emails![0].value);

      if (!user) {
        // Créer un nouvel utilisateur si nécessaire
        user = await storage.createUser({
          username: profile.emails![0].value,
          email: profile.emails![0].value,
          password: '', // Pas de mot de passe pour les utilisateurs Google
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName
        });
      }

      const { password, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }
); 