import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Username ou E-mail são obrigatórios"),
  password: z.string().min(6, "Senha teve ter pelo menos 6 caracteres"),
});

export type LoginDto = z.infer<typeof LoginSchema>;
