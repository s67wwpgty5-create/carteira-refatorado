/**
 * Security helpers for ownership validation and user isolation
 */

import { Database } from '@/lib/database';
import { Client } from '@/lib/portfolio';

export interface SecurityContext {
  userId: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Validates that a resource (client) belongs to the authenticated user
 */
export async function validateResourceOwnership(
  db: Database,
  userId: string,
  clientId: string
): Promise<boolean> {
  try {
    // Try to find the client in the user's active dataset
    const activeDataset = await db.prepare(
      "SELECT payload FROM records WHERE owner=? AND kind='active' AND id='dataset'"
    ).bind(userId).first<{ payload: string }>();

    if (!activeDataset) {
      return false;
    }

    const dataset = JSON.parse(activeDataset.payload);

    // Get clients from imported batch
    const clientsResult = await db.prepare(
      'SELECT id FROM imported_clients WHERE batch=? AND id=?'
    ).bind(dataset.id, clientId).first<{ id: string }>();

    return !!clientsResult;
  } catch (error) {
    console.error('Ownership validation failed:', error);
    return false;
  }
}

/**
 * Validates that multiple resources belong to the authenticated user
 */
export async function validateBulkResourceOwnership(
  db: Database,
  userId: string,
  clientIds: string[]
): Promise<{ valid: string[]; invalid: string[] }> {
  try {
    const activeDataset = await db.prepare(
      "SELECT payload FROM records WHERE owner=? AND kind='active' AND id='dataset'"
    ).bind(userId).first<{ payload: string }>();

    if (!activeDataset) {
      return { valid: [], invalid: clientIds };
    }

    const dataset = JSON.parse(activeDataset.payload);

    const results = await db.prepare(
      'SELECT id FROM imported_clients WHERE batch=? AND id IN (' +
      clientIds.map(() => '?').join(',') +
      ')'
    ).bind(dataset.id, ...clientIds).all<{ id: string }>();

    const validIds = new Set(results.results.map(r => r.id));
    const valid = clientIds.filter(id => validIds.has(id));
    const invalid = clientIds.filter(id => !validIds.has(id));

    return { valid, invalid };
  } catch (error) {
    console.error('Bulk ownership validation failed:', error);
    return { valid: [], invalid: clientIds };
  }
}

/**
 * Extract real IP address from request (handling proxies)
 */
export function getClientIpAddress(request: Request): string | undefined {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Cloudflare specific
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return undefined;
}

/**
 * Create a security context from request
 */
export function createSecurityContext(request: Request, userId: string): SecurityContext {
  return {
    userId,
    requestId: crypto.randomUUID(),
    ipAddress: getClientIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined
  };
}

/**
 * Validate CORS origin
 */
export function validateCorsOrigin(
  request: Request,
  allowedOrigins: string[] = []
): boolean {
  const origin = request.headers.get('origin');

  if (!origin) {
    // Requests without Origin header are allowed (e.g., same-site requests)
    return true;
  }

  const requestUrl = new URL(request.url);
  const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`;

  // Always allow same-origin requests
  if (origin === requestOrigin) {
    return true;
  }

  // Check against allowed list
  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }

  // Default: reject cross-origin if no allowlist
  return false;
}

/**
 * Sanitize error message for user response
 * (don't expose internal details)
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('not found') || msg.includes('no rows')) {
      return 'Recurso não encontrado';
    }

    if (msg.includes('duplicate') || msg.includes('unique')) {
      return 'Registro duplicado ou já existe';
    }

    if (msg.includes('foreign key')) {
      return 'Referência inválida';
    }
  }

  return 'Erro ao processar solicitação. Por favor tente novamente.';
}

/**
 * Check if string is valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if string is valid client ID (numeric)
 */
export function isValidClientId(id: string): boolean {
  return /^\d+$/.test(id);
}
