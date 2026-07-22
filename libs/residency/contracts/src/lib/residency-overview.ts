import { z } from 'zod';

const nonNegativeCountSchema = z.number().int().nonnegative();

const residencyChangeActivitySchema = z
  .object({
    id: z.uuid(),
    changeType: z.enum(['MOVE_IN', 'MOVE_OUT', 'CORRECTION']),
    workflowStage: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'APPLIED']),
    submittedDateTime: z.iso.datetime({ offset: true }),
    updatedDateTime: z.iso.datetime({ offset: true }),
  })
  .strict();

export const residencyOverviewSchema = z
  .object({
    records: z
      .object({
        activeHouseCount: nonNegativeCountSchema,
        occupiedHouseCount: nonNegativeCountSchema,
        currentResidentCount: nonNegativeCountSchema,
      })
      .strict()
      .nullable(),
    changes: z
      .object({
        pendingCount: nonNegativeCountSchema,
        recent: z.array(residencyChangeActivitySchema).max(5),
      })
      .strict()
      .nullable(),
  })
  .strict();

export type ResidencyOverview = z.infer<typeof residencyOverviewSchema>;
