import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { AuthRequest, generateToken, LoginDto, LoginSchema } from "@cozynyan/common";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async createSession(
    userId: string,
    refreshToken: string,
    req: AuthRequest,
  ): Promise<void> {
    const hashedRefreshToken: string = await bcrypt.hash(refreshToken, 10);
    const device: string = req.headers["user-agent"] || "Device desconhecido";
    const ip: string = req.ip || "IP desconhecido";

    await this.prisma.session.create({
      data: {
        user: { connect: { id: userId } },
        refreshToken: hashedRefreshToken,
        device,
        ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async validateUser(data: LoginDto) {
    const { identifier, password } = LoginSchema.parse(data);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return user;
  }

  async login(data: LoginDto, req: AuthRequest) {
    const user = await this.validateUser(data);

    const { access_token, refresh_token } = generateToken(this.jwtService, {
      id: user.id,
      username: user.username,
      email: user.email,
      admin: user.admin,
    });

    await this.createSession(user.id, refresh_token, req);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        admin: user.admin,
      },
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: { userId, refreshToken: { not: null } },
      include: { user: true },
    });

    if (!session || !session.refreshToken) {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    const isValid = await bcrypt.compare(refreshToken, session.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    const { access_token, refresh_token: newRefreshToken } = generateToken(this.jwtService, {
      id: user.id,
      username: user.username,
      email: user.email,
      admin: user.admin,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: await bcrypt.hash(newRefreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { access_token, refresh_token: newRefreshToken };
  }

  async logout(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new UnauthorizedException("Sessão não encontrada");
    }

    await this.prisma.session.delete({ where: { id: sessionId } });

    return { message: "Usuário deslogado com sucesso" };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });

    return { message: "Todas as sessões deslogadas com sucesso" };
  }

  async getUserSessions(userId: string, admin: boolean) {
    if (admin) {
      return this.prisma.session.findMany({
        select: {
          id: true,
          user: {
            select: { id: true, username: true, email: true, admin: true },
          },
          device: true,
          ip: true,
          createdAt: true,
          expiresAt: true,
        },
      });
    }

    return this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        device: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }
}
