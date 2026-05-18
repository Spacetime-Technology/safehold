import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

// Minimal 1x1 transparent PNG for photo tests
const STUB_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Retrieval tools', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());

    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'Test Passport',
        fields: {
          given_name: 'Alice',
          family_name: 'Smith',
          nationality: 'GBR',
          date_of_birth: '1990-01-01',
          passport_number: 'P12345678',
          expiry_date: '2030-01-01',
          issuing_country: 'GBR',
          gender: 'F',
        },
      },
    });

    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'national_id',
        label: 'Test National ID',
        fields: {
          given_name: 'Alice',
          family_name: 'Smith',
          date_of_birth: '1990-01-01',
          id_number: 'NI12345678',
          nationality: 'GBR',
          expiry_date: '2030-01-01',
          issuing_country: 'GBR',
        },
      },
    });

    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'driving_license',
        label: 'Test Driving Licence',
        fields: {
          given_name: 'Alice',
          family_name: 'Smith',
          date_of_birth: '1990-01-01',
          license_number: 'SMITH90001AA1AB',
          categories: 'B,BE',
          expiry_date: '2030-01-01',
          issuing_authority: 'DVLA',
        },
      },
    });

    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'visa',
        label: 'Test Visa',
        fields: {
          visa_type: 'tourist',
          issuing_country: 'USA',
          issue_date: '2025-01-01',
          expiry_date: '2027-01-01',
          entries_allowed: 'multiple',
          reference_number: 'VISA-001',
        },
      },
    });

    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'photo_passport_style',
        label: 'Passport Photo',
        fields: {
          data: STUB_PNG_BASE64,
          mime_type: 'image/png',
        },
      },
    });

    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'insurance_card',
        label: 'Test Insurance Card',
        fields: {
          policy_number: 'POL-123456',
          expiry_date: '2027-12-31',
          provider: 'ACME Health',
        },
      },
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('get_passport', () => {
    it('returns requested fields with real values', async () => {
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name', 'passport_number'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('passport');
      expect(parsed['fields']).toHaveProperty('given_name');
      expect(parsed['fields']).toHaveProperty('passport_number');
      expect((parsed['fields'] as Record<string, unknown>)['given_name']).toBe('Alice');
      expect((parsed['fields'] as Record<string, unknown>)['passport_number']).toBe('P12345678');
    });

    it('only returns requested fields', async () => {
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name'], purpose: 'test' },
      });
      const parsed = parseToolResult(result.content);
      expect(Object.keys(parsed['fields'] as object)).toEqual(['given_name']);
    });
  });

  describe('get_national_id', () => {
    it('returns requested fields with real values', async () => {
      const result = await client.callTool({
        name: 'get_national_id',
        arguments: { fields: ['given_name', 'id_number'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('national_id');
      expect(parsed['fields']).toHaveProperty('id_number');
      expect((parsed['fields'] as Record<string, unknown>)['id_number']).toBe('NI12345678');
    });
  });

  describe('get_driving_license', () => {
    it('returns requested fields with real values', async () => {
      const result = await client.callTool({
        name: 'get_driving_license',
        arguments: { fields: ['given_name', 'license_number'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('driving_license');
      expect(parsed['fields']).toHaveProperty('license_number');
      expect((parsed['fields'] as Record<string, unknown>)['license_number']).toBe(
        'SMITH90001AA1AB'
      );
    });
  });

  describe('get_visa', () => {
    it('returns requested fields with real values', async () => {
      const result = await client.callTool({
        name: 'get_visa',
        arguments: { fields: ['visa_type', 'expiry_date'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('visa');
      expect(parsed['fields']).toHaveProperty('visa_type');
      expect(parsed['fields']).toHaveProperty('expiry_date');
      expect((parsed['fields'] as Record<string, unknown>)['visa_type']).toBe('tourist');
    });
  });

  describe('get_photo', () => {
    it('returns base64 data and mime_type', async () => {
      const result = await client.callTool({
        name: 'get_photo',
        arguments: { type: 'passport_style', purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('mime_type');
      expect(typeof parsed['data']).toBe('string');
      expect(parsed['photo_type']).toBe('passport_style');
    });
  });

  describe('get_document', () => {
    it('returns fields from any stored document type', async () => {
      const result = await client.callTool({
        name: 'get_document',
        arguments: {
          document_type: 'insurance_card',
          fields: ['policy_number', 'expiry_date'],
          purpose: 'test',
        },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('insurance_card');
      expect(parsed['fields']).toHaveProperty('policy_number');
      expect(parsed['fields']).toHaveProperty('expiry_date');
      expect((parsed['fields'] as Record<string, unknown>)['policy_number']).toBe('POL-123456');
    });
  });

  describe('access log', () => {
    it('records an entry for each retrieval', async () => {
      const result = await client.callTool({
        name: 'get_access_log',
        arguments: { limit: 50 },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      const entries = parsed['entries'] as unknown[];
      expect(entries.length).toBeGreaterThan(0);
    });
  });
});
