import { z } from "zod";

export const JwtPayloadSchema = z.object({
  sub: z.uuid(),
  username: z.string(),
  email: z.email(),
  admin: z.boolean(),
  iat: z.optional(z.number()),
  exp: z.optional(z.number()),
});

export type JwtPayloadInterface = z.infer<typeof JwtPayloadSchema>;
