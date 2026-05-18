import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Retrieval tools', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('get_passport', () => {
    it('returns requested fields', async () => {
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name', 'passport_number'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('passport');
      expect(parsed['fields']).toHaveProperty('given_name');
      expect(parsed['fields']).toHaveProperty('passport_number');
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
    it('returns requested fields', async () => {
      const result = await client.callTool({
        name: 'get_national_id',
        arguments: { fields: ['given_name', 'id_number'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('national_id');
      expect(parsed['fields']).toHaveProperty('id_number');
    });
  });

  describe('get_driving_license', () => {
    it('returns requested fields', async () => {
      const result = await client.callTool({
        name: 'get_driving_license',
        arguments: { fields: ['given_name', 'license_number'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('driving_license');
      expect(parsed['fields']).toHaveProperty('license_number');
    });
  });

  describe('get_visa', () => {
    it('returns requested fields', async () => {
      const result = await client.callTool({
        name: 'get_visa',
        arguments: { fields: ['visa_type', 'expiry_date'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['document_type']).toBe('visa');
      expect(parsed['fields']).toHaveProperty('visa_type');
      expect(parsed['fields']).toHaveProperty('expiry_date');
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
    it('accepts arbitrary document type and fields', async () => {
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
    });
  });
});
