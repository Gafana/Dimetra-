import { z } from 'zod';

export const seasonSchema = z.enum(['summer', 'winter']);

export const createRoomBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(200),
});

export const updateRoomBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(200),
});

export const roomIdParamSchema = z.object({
  id: z.string().uuid(),
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

import { isValidIanaTimeZone } from '../lib/time.js';

export const updateSettingsBodySchema = z
  .object({
    notification_time: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, 'notification_time must be HH:MM:SS')
      .optional(),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .refine((value) => isValidIanaTimeZone(value), 'timezone must be a valid IANA name')
      .optional(),
  })
  .refine(
    (body) => body.notification_time !== undefined || body.timezone !== undefined,
    'At least one of notification_time or timezone is required',
  );

export const plantIdParamSchema = z.object({
  id: z.string().uuid(),
});

const isoDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .nullable();

export const updatePlantScheduleBodySchema = z
  .object({
    next_watering_date: isoDateField.optional(),
    next_feeding_date: isoDateField.optional(),
  })
  .refine(
    (body) => body.next_watering_date !== undefined || body.next_feeding_date !== undefined,
    'At least one date field is required',
  );

export const updatePlantPhotoBodySchema = z.object({
  photo_url: z
    .string()
    .max(500_000, 'photo is too large')
    .refine(
      (value) => value.startsWith('data:image/') || /^https?:\/\//i.test(value),
      'photo_url must be data:image/… or http(s) URL',
    )
    .nullable(),
});

export const calendarQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
});

const seasonIntervalsSchema = z.object({
  wateringDays: z.number().int().min(1).max(120),
  feedingDays: z.number().int().min(1).max(120),
});

export const upsertPlantCatalogBodySchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'id must be lowercase latin, digits and dashes')
    .optional(),
  name: z.string().trim().min(1).max(200),
  nameLatin: z.string().trim().max(200).nullable().optional(),
  imageUrl: z.string().trim().url('imageUrl must be a valid URL').max(2000),
  description: z.string().trim().max(20000).nullable().optional(),
  wateringNotes: z.string().trim().max(4000).nullable().optional(),
  feedingProduct: z.string().trim().max(500).nullable().optional(),
  feedingNotes: z.string().trim().max(4000).nullable().optional(),
  lightLevel: z.enum(['window_moscow_ok', 'bright_window', 'grow_lamp']),
  lightNotes: z.string().trim().max(2000).nullable().optional(),
  seasons: z.object({
    summer: seasonIntervalsSchema,
    winter: seasonIntervalsSchema,
  }),
  sourceUrl: z.string().trim().url().max(2000).nullable().optional(),
});

export const plantCatalogIdParamSchema = z.object({
  id: z.string().trim().min(1).max(80),
});
