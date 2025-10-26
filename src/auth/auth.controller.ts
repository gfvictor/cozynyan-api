import {
  Controller,
  UseGuards,
  Request,
  Body,
  Post,
  Get,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthRequest, LoginDto, RefreshTokenDto } from "@cozynyan/common";
import { JwtAuthGuard } from "./guard/jwt-auth.guard";
import { z } from "zod";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Request() req: AuthRequest) {
    return this.authService.login(body, req);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.userId, body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { sessionId: string }) {
    const { sessionId } = z
      .object({ sessionId: z.uuid("ID da sessão deve ser um UUID válido") })
      .parse(body);
    return this.authService.logout(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Request() req: AuthRequest) {
    return this.authService.logoutAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  async getUserSessions(@Request() req: AuthRequest) {
    return this.authService.getUserSessions(req.user.id, req.user.admin);
  }
}
