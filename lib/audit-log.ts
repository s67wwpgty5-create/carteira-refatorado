/**
 * Módulo de auditoria de operações críticas
 * Registra todas as mutações de dados para rastreamento
 */

import { Database } from '@/lib/database';

export type AuditAction =
  | 'contact_create'
  | 'contact_update'
  | 'contact_delete'
  | 'activity_create'
  | 'activity_complete'
  | 'activity_delete'
  | 'audience_create'
  | 'schedule_create'
  | 'schedule_cancel'
  | 'import_complete'
  | 'coverage_confirm';

export interface AuditLogEntry {
  id: string;
  owner: string;
  userId: string;
  action: AuditAction;
  resourceId?: string;
  resourceKind?: string;
  timestamp: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(
  db: Database,
  userId: string,
  action: AuditAction,
  resourceId?: string,
  resourceKind?: string,
  changes?: { before?: unknown; after?: unknown },
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const now = new Date().toISOString();
  const id = `${userId}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    await db.prepare(`
      INSERT INTO audit_log (id, owner, userId, action, resourceId, resourceKind, timestamp, changes, ipAddress, userAgent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId.split('-')[0], // owner = first part of userId
      userId,
      action,
      resourceId || null,
      resourceKind || null,
      now,
      changes ? JSON.stringify(changes) : null,
      ipAddress || null,
      userAgent || null
    ).run();
  } catch (error) {
    // Log audit failures to console but don't break the operation
    console.error('Audit log failed:', error);
  }
}

export async function getAuditLog(
  db: Database,
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<AuditLogEntry[]> {
  try {
    const results = await db.prepare(`
      SELECT id, owner, userId, action, resourceId, resourceKind, timestamp, changes, ipAddress, userAgent
      FROM audit_log
      WHERE userId = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all<{
      id: string;
      owner: string;
      userId: string;
      action: string;
      resourceId?: string;
      resourceKind?: string;
      timestamp: string;
      changes?: string;
      ipAddress?: string;
      userAgent?: string;
    }>();

    return results.results.map(row => ({
      id: row.id,
      owner: row.owner,
      userId: row.userId,
      action: row.action as AuditAction,
      resourceId: row.resourceId,
      resourceKind: row.resourceKind,
      timestamp: row.timestamp,
      changes: row.changes ? JSON.parse(row.changes) : undefined,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent
    }));
  } catch (error) {
    console.error('Failed to retrieve audit log:', error);
    return [];
  }
}

export async function purgeOldAuditLogs(
  db: Database,
  daysToKeep: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const result = await db.prepare(`
      DELETE FROM audit_log
      WHERE timestamp < ?
    `).bind(cutoffDate.toISOString()).run();

    return result.meta.changes;
  } catch (error) {
    console.error('Failed to purge audit logs:', error);
    return 0;
  }
}
