import { z } from 'zod';

export const seasonSchema = z.enum(['summer', 'winter']);

export const createRoomBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(200),
});

export const createPlantBodySchema = z.object({
  custom_name: z.string().trim().min(1).max(200),
  room_id: z.string().uuid().nullable().optional(),
  catalog_id: z.string().trim().min(1),
  last_repot_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'last_repot_date must be YYYY-MM-DD')
    .nullable()
    .optional(),
  current_season: seasonSchema,
});

export const plantActionBodySchema = z.object({
  action_type: z.enum(['watering', 'feeding']),
});

export const updateSettingsBodySchema = z.object({
  notification_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, 'notification_time must be HH:MM:SS'),
});

export const plantIdParamSchema = z.object({
  id: z.string().uuid(),
});
