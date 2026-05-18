export const PASSPORT_FIELDS = [
  'given_name',
  'family_name',
  'nationality',
  'date_of_birth',
  'passport_number',
  'expiry_date',
  'issuing_country',
  'gender',
] as const;

export const NATIONAL_ID_FIELDS = [
  'given_name',
  'family_name',
  'date_of_birth',
  'id_number',
  'nationality',
  'expiry_date',
  'issuing_country',
] as const;

export const DRIVING_LICENSE_FIELDS = [
  'given_name',
  'family_name',
  'date_of_birth',
  'license_number',
  'categories',
  'expiry_date',
  'issuing_authority',
] as const;

export const VISA_FIELDS = [
  'visa_type',
  'issuing_country',
  'issue_date',
  'expiry_date',
  'entries_allowed',
  'reference_number',
] as const;

export type SupportedDocumentType = 'passport' | 'national_id' | 'driving_license' | 'visa';

export const DOCUMENT_FIELDS: Record<SupportedDocumentType, readonly string[]> = {
  passport: PASSPORT_FIELDS,
  national_id: NATIONAL_ID_FIELDS,
  driving_license: DRIVING_LICENSE_FIELDS,
  visa: VISA_FIELDS,
};

export const DOCUMENT_TYPE_LABELS: Record<SupportedDocumentType, string> = {
  passport: 'passport',
  national_id: 'national ID',
  driving_license: 'driving licence',
  visa: 'visa',
};
