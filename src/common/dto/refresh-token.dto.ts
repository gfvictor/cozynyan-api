import { z } from "zod";

export const RefreshTokenSchema = z.object({
  userId: z.uuid("ID do usuário deve ser um UUID válido"),
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
