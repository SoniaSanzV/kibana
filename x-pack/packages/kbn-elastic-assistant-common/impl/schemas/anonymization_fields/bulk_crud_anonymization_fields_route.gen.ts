/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from 'zod';

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Bulk Actions API endpoint
 *   version: 1
 */

import { UUID, NonEmptyString } from '../conversations/common_attributes.gen';

export type BulkActionSkipReason = z.infer<typeof BulkActionSkipReason>;
export const BulkActionSkipReason = z.literal('ANONYMIZATION_FIELD_NOT_MODIFIED');

export type BulkActionSkipResult = z.infer<typeof BulkActionSkipResult>;
export const BulkActionSkipResult = z.object({
  id: z.string(),
  name: z.string().optional(),
  skip_reason: BulkActionSkipReason,
});

export type AnonymizationFieldDetailsInError = z.infer<typeof AnonymizationFieldDetailsInError>;
export const AnonymizationFieldDetailsInError = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export type NormalizedAnonymizationFieldError = z.infer<typeof NormalizedAnonymizationFieldError>;
export const NormalizedAnonymizationFieldError = z.object({
  message: z.string(),
  status_code: z.number().int(),
  err_code: z.string().optional(),
  anonymization_fields: z.array(AnonymizationFieldDetailsInError),
});

export type AnonymizationFieldResponse = z.infer<typeof AnonymizationFieldResponse>;
export const AnonymizationFieldResponse = z.object({
  id: UUID,
  timestamp: NonEmptyString.optional(),
  field: z.string(),
  allowed: z.boolean().optional(),
  anonymized: z.boolean().optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  /**
   * Kibana space
   */
  namespace: z.string().optional(),
});

export type BulkCrudActionResults = z.infer<typeof BulkCrudActionResults>;
export const BulkCrudActionResults = z.object({
  updated: z.array(AnonymizationFieldResponse),
  created: z.array(AnonymizationFieldResponse),
  deleted: z.array(z.string()),
  skipped: z.array(BulkActionSkipResult),
});

export type BulkCrudActionSummary = z.infer<typeof BulkCrudActionSummary>;
export const BulkCrudActionSummary = z.object({
  failed: z.number().int(),
  skipped: z.number().int(),
  succeeded: z.number().int(),
  total: z.number().int(),
});

export type BulkCrudActionResponse = z.infer<typeof BulkCrudActionResponse>;
export const BulkCrudActionResponse = z.object({
  success: z.boolean().optional(),
  status_code: z.number().int().optional(),
  message: z.string().optional(),
  anonymization_fields_count: z.number().int().optional(),
  attributes: z.object({
    results: BulkCrudActionResults,
    summary: BulkCrudActionSummary,
    errors: z.array(NormalizedAnonymizationFieldError).optional(),
  }),
});

export type BulkActionBase = z.infer<typeof BulkActionBase>;
export const BulkActionBase = z.object({
  /**
   * Query to filter anonymization fields
   */
  query: z.string().optional(),
  /**
   * Array of anonymization fields IDs
   */
  ids: z.array(z.string()).min(1).optional(),
});

export type AnonymizationFieldCreateProps = z.infer<typeof AnonymizationFieldCreateProps>;
export const AnonymizationFieldCreateProps = z.object({
  field: z.string(),
  allowed: z.boolean().optional(),
  anonymized: z.boolean().optional(),
});

export type AnonymizationFieldUpdateProps = z.infer<typeof AnonymizationFieldUpdateProps>;
export const AnonymizationFieldUpdateProps = z.object({
  id: z.string(),
  allowed: z.boolean().optional(),
  anonymized: z.boolean().optional(),
});

export type PerformBulkActionRequestBody = z.infer<typeof PerformBulkActionRequestBody>;
export const PerformBulkActionRequestBody = z.object({
  delete: BulkActionBase.optional(),
  create: z.array(AnonymizationFieldCreateProps).optional(),
  update: z.array(AnonymizationFieldUpdateProps).optional(),
});
export type PerformBulkActionRequestBodyInput = z.input<typeof PerformBulkActionRequestBody>;

export type PerformBulkActionResponse = z.infer<typeof PerformBulkActionResponse>;
export const PerformBulkActionResponse = BulkCrudActionResponse;
