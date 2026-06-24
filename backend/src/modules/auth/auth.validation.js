import { z } from "zod";

export const loginValidation = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Username is required" })
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must not exceed 30 characters"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});