import * as z from "zod/v4";
import { toWire } from "../lib/wire";

export const meUserOutput = toWire(
  z.object({
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
      image: z.string().nullable().optional(),
      createdAt: z.date(),
      updatedAt: z.date(),
      role: z.string().nullable().optional(),
      banned: z.boolean().nullable().optional(),
      banReason: z.string().nullable().optional(),
      banExpires: z.date().nullable().optional(),
    }),
  }),
);

export const meHasPasswordOutput = z.object({ hasPassword: z.boolean() });

export type MeUserResponse = z.output<typeof meUserOutput>;
export type MeUser = MeUserResponse["user"];
export type MeHasPasswordResponse = z.output<typeof meHasPasswordOutput>;
