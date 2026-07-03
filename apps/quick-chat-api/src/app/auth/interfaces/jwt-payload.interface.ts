import { PlatformRole } from "@quick-chat/prisma-client";

export interface JwtPayload {
  sub: string;
  email: string;
  platformRole: PlatformRole;
}