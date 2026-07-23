import { z } from 'zod';

const nonNegativeCountSchema = z.number().int().nonnegative();
const minorUnitSchema = z.string().regex(/^-?\d+$/);

const latestFinancialReportSchema = z
  .object({
    id: z.uuid(),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    revisionNumber: z.number().int().positive(),
    workflowStage: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED']),
    currency: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/),
    openingBalanceMinor: minorUnitSchema,
    incomeTotalMinor: minorUnitSchema,
    expenseTotalMinor: minorUnitSchema,
    closingBalanceMinor: minorUnitSchema,
  })
  .strict();

export const financeOverviewSchema = z
  .object({
    latestReport: latestFinancialReportSchema.nullable(),
    approvalRequiredCount: nonNegativeCountSchema.nullable(),
  })
  .strict();

export type FinanceOverview = z.infer<typeof financeOverviewSchema>;
