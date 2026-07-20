import { z } from 'zod';

const identifierSchema = z.uuid();

const assignmentSummarySchema = z
  .object({
    code: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(160),
  })
  .strict();

export const permissionCodeSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9]*(?:[.:_-][a-z0-9]+)*$/);

export const signInInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(8).max(128),
  })
  .strict();

export type SignInInput = z.infer<typeof signInInputSchema>;

export const sessionContextSchema = z
  .object({
    user: z
      .object({
        id: identifierSchema,
        email: z.email(),
      })
      .strict(),
    membershipId: identifierSchema,
    community: z
      .object({
        id: identifierSchema,
        name: z.string().trim().min(1).max(160),
        slug: z.string().trim().min(1).max(160),
        timezone: z.string().trim().min(1).max(100),
        currency: z
          .string()
          .length(3)
          .regex(/^[A-Z]{3}$/),
      })
      .strict(),
    positions: z.array(assignmentSummarySchema),
    roles: z.array(assignmentSummarySchema),
    permissions: z.array(permissionCodeSchema),
  })
  .strict();

export type SessionContext = z.infer<typeof sessionContextSchema>;
