import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthRequest, JwtPayloadInterface, JwtPayloadSchema } from "@cozynyan/common";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthRequest = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader: string = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token inválido ou não fornecido");
    }

    const token: string = authHeader.split(" ")[1];
    try {
      const decoded = this.jwtService.verify<JwtPayloadInterface>(token);
      const payload = JwtPayloadSchema.parse(decoded);

      request.user = {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
        admin: payload.admin,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
  }
}
