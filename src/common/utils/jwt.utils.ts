import { JwtService } from "@nestjs/jwt";
import { JwtPayloadInterface } from "@cozynyan/common";

export function generateToken(
  jwtService: JwtService,
  user: {
    id: string;
    username: string;
    email: string;
    admin: boolean;
  },
) {
  const payload: JwtPayloadInterface = {
    sub: user.id,
    username: user.username,
    email: user.email,
    admin: user.admin,
  };

  return {
    access_token: jwtService.sign(payload, { expiresIn: "1h" }),
    refresh_token: jwtService.sign(payload, { expiresIn: "7d" }),
  };
}
