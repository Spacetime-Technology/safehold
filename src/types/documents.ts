export interface PassportFields {
  given_name: string;
  family_name: string;
  nationality: string;
  date_of_birth: string;
  passport_number: string;
  expiry_date: string;
  issuing_country: string;
  gender: string;
}

export interface DrivingLicenseFields {
  given_name: string;
  family_name: string;
  date_of_birth: string;
  license_number: string;
  categories: string[];
  expiry_date: string;
  issuing_authority: string;
}

export interface NationalIdFields {
  given_name: string;
  family_name: string;
  date_of_birth: string;
  id_number: string;
  nationality: string;
  expiry_date: string;
  issuing_country: string;
}

export interface VisaFields {
  visa_type: string;
  issuing_country: string;
  issue_date: string;
  expiry_date: string;
  entries_allowed: string;
  reference_number: string;
}

export interface PhotoResult {
  data: string;
  mime_type: string;
  photo_type: string;
}

export interface DocumentMetadata {
  id: string;
  type: string;
  label: string;
  expiry_date?: string;
}

export type PhotoType = 'passport_style' | 'selfie' | 'signature';
