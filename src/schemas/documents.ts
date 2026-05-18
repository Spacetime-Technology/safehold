import { z } from 'zod/v4';

export const PASSPORT_SCHEMA = z
  .object({
    given_name: z.string(),
    family_name: z.string(),
    nationality: z.string(),
    date_of_birth: z.string(),
    passport_number: z.string(),
    expiry_date: z.string(),
    issuing_country: z.string(),
    gender: z.string(),
  })
  .strict();

export const NATIONAL_ID_SCHEMA = z
  .object({
    given_name: z.string(),
    family_name: z.string(),
    date_of_birth: z.string(),
    id_number: z.string(),
    nationality: z.string(),
    expiry_date: z.string(),
    issuing_country: z.string(),
  })
  .strict();

export const DRIVING_LICENSE_SCHEMA = z
  .object({
    given_name: z.string(),
    family_name: z.string(),
    date_of_birth: z.string(),
    license_number: z.string(),
    categories: z.union([z.string(), z.array(z.string())]),
    expiry_date: z.string(),
    issuing_authority: z.string(),
  })
  .strict();

export const VISA_SCHEMA = z
  .object({
    visa_type: z.string(),
    issuing_country: z.string(),
    issue_date: z.string(),
    expiry_date: z.string(),
    entries_allowed: z.string(),
    reference_number: z.string(),
  })
  .strict();

export const PHOTO_SCHEMA = z
  .object({
    data: z.string(),
    mime_type: z.string(),
  })
  .strict();

export const DOCUMENT_SCHEMAS: Record<string, z.ZodObject> = {
  passport: PASSPORT_SCHEMA,
  national_id: NATIONAL_ID_SCHEMA,
  driving_license: DRIVING_LICENSE_SCHEMA,
  visa: VISA_SCHEMA,
  photo_passport_style: PHOTO_SCHEMA,
  photo_selfie: PHOTO_SCHEMA,
  photo_signature: PHOTO_SCHEMA,
};

export function validateDocumentFields(
  documentType: string,
  fields: Record<string, unknown>
): { ok: true } | { ok: false; error: string } {
  const schema = DOCUMENT_SCHEMAS[documentType];
  if (!schema) return { ok: true };
  const result = schema.partial().safeParse(fields);
  if (result.success) return { ok: true };
  const issues = result.error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  return { ok: false, error: `Invalid ${documentType} fields: ${issues}` };
}
