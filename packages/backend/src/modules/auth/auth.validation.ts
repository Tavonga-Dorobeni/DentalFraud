import { z } from "zod";

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1)
  })
};
