import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginRequest, TokenPair, UserRole } from "@fdcdf/shared";
import { env } from "../../common/config/env";
import { AuthenticationError } from "../../common/errors/app-error";
import { findUserByEmail } from "./auth.repository";

interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
}

const createTokens = (payload: AuthPayload): TokenPair => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });

  return {
    accessToken,
    refreshToken
  };
};

export const login = async (input: LoginRequest): Promise<TokenPair> => {
  const user = await findUserByEmail(input.email.toLowerCase());

  if (!user || !bcrypt.compareSync(input.password, user.password_hash)) {
    throw new AuthenticationError("Invalid email or password");
  }

  return createTokens({
    id: user.id,
    email: user.email,
    role: user.role as UserRole
  });
};

export const refresh = (refreshToken: string): TokenPair => {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;
    return createTokens(payload);
  } catch {
    throw new AuthenticationError("Invalid refresh token");
  }
};
