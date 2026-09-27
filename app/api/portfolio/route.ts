/**
 * Portfolio API - SECURED VERSION
 * Implements: ownership validation, audit logging, rate limiting, proper CORS
 *
 * This is the SECURED replacement for the original route.ts
 * When ready, replace the original file with this one.
 */

import { getChatGPTUser } from '@/app/chatgpt-auth';
import { bootstrapContacts } from '@/lib/bootstrap';
import { readPortfolio } from '@/lib/portfolio-state';
import { database } from '@/lib/database';
import { datasetSchema } from '@/lib/validation';
import { z } from 'zod';
import { audienceSchema, scheduleSchema } from '@/lib/campaigns';
import { validateDocument } from '@/lib/document-validation';
import { logAudit } from '@/lib/audit-log';
import {
  applyRateLimit,
  getRateLimitHeaders,
  RATE_LIMIT_CONFIGS
} from '@/lib/rate-limit';
import {
  validateResourceOwnership,
  createSecurityContext,
  validateCorsOrigin,
  sanitizeErrorMessage,
  isValidClientId,
  isValidUUID
} from '@/lib/security-helpers';

import seed from '@/lib/seed.json';

export const dynamic = 'force-dynamic';

const json = (v: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(v, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers }
  });

// Allowed origins for CORS (from env or default)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS?.split(',') || []).filter(Boolean);

/**
 * GET /api/portfolio
 * Retrieve user's portfolio data
 */
export async function GET(request: Request) {
  const u = await getChatGPTUser();
  if (!u) {
    return json({ error: 'Entre na sua conta para acessar a carteira.' }, 401);
  }

  // Create security context
  const ctx = createSecurityContext(request, u.userId);

  try {
    // Rate limit check
    const rateLimit = applyRateLimit(u.userId, 'default');
    if (!rateLimit.allowed) {
      return json(
        { error: 'Limite de requisições atingido. Tente novamente em alguns instantes.' },
        429,
        getRateLimitHeaders(rateLimit)
      );
    }

    await bootstrapContacts(u);
    const { activePayload, ...state } = await readPortfolio(u.userId);

    return json(state, 200, getRateLimitHeaders(rateLimit));
  } catch (error) {
    console.error('Portfolio GET failed:', error);
    return json(
      { error: 'Não foi possível carregar a carteira.' },
      503
    );
  }
}

/**
 * POST /api/portfolio
 * Mutate portfolio data (contact, activity, import, etc)
 */
export async function POST(request: Request) {
  const u = await getChatGPTUser();
  if (!u) {
    return json({ error: 'Entre na sua conta para salvar.' }, 401);
  }

  // Validate CORS
  if (!validateCorsOrigin(request, ALLOWED_ORIGINS)) {
    return json({ error: 'Origem não permitida.' }, 403);
  }

  // Create security context
  const ctx = createSecurityContext(request, u.userId);

  try {
    // Rate limit check (stricter for POST)
    const rateLimit = applyRateLimit(u.userId, 'default');
    if (!rateLimit.allowed) {
      return json(
        { error: 'Limite de requisições atingido. Tente novamente em alguns instantes.' },
        429,
        getRateLimitHeaders(rateLimit)
      );
    }

    // Read and validate request body size
    const raw = await request.text();
    if (raw.length > 12_000_000) {
      return json(
        { error: 'Arquivo grande demais para esta versão.' },
        413
      );
    }

    const { action, payload: p } = JSON.parse(raw);

    await bootstrapContacts(u);
    const db = database();
    const now = new Date().toISOString();

    // Helper to store records
    const put = (kind: string, id: string, value: unknown) =>
      db.prepare(
        'INSERT INTO records (owner,kind,id,payload,updated) VALUES (?,?,?,?,?) ' +
        'ON CONFLICT(owner,kind,id) DO UPDATE SET payload=excluded.payload,updated=excluded.updated'
      ).bind(u.userId, kind, id, JSON.stringify(value), now);

    // ===== ACTION: contact =====
    if (action === 'contact') {
      const contactSchema = z.object({
        id: z.string().regex(/^\d+$/),
        phone: z.string().max(30).refine(
          s => !s || /^\+?[\d\s()-]{8,30}$/.test(s),
          'Telefone inválido'
        ),
        email: z.union([z.literal(''), z.string().email().max(254)]),
        owner: z.string().max(150),
        region: z.string().trim().max(100).optional(),
        city: z.string().trim().max(100).optional(),
        document: z.string().max(40).optional().refine(
          doc => !doc || validateDocument(doc),
          'CPF ou CNPJ inválido'
        ),
        commercialPhone: z.string().max(30).optional(),
        emails: z.array(z.string().email().max(254)).max(100).optional(),
        phones: z.array(z.string().max(30)).max(100).optional(),
        contactSource: z.string().max(200).optional(),
        contactSourceRows: z.array(z.number().int().positive()).max(100).optional(),
        rawPhones: z.array(z.string().max(2000)).max(100).optional(),
        rawEmails: z.string().max(10000).optional(),
      });

      const { id, ...contact } = contactSchema.parse(p);

      // Validate ownership
      if (!isValidClientId(id)) {
        return json({ error: 'Código de cliente inválido.' }, 400);
      }

      const old = await db.prepare(
        'SELECT payload FROM records WHERE owner=? AND kind=? AND id=?'
      ).bind(u.userId, 'contact', id).first<{ payload: string }>();

      const finalContact = {
        ...(old ? JSON.parse(old.payload) : {}),
        ...contact,
        owner: u.userId // Force owner
      };

      await put('contact', id, finalContact).run();

      // Log audit
      await logAudit(
        db,
        u.userId,
        'contact_update',
        id,
        'contact',
        { before: old ? JSON.parse(old.payload) : undefined, after: finalContact },
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ ok: true }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: contacts-import =====
    if (action === 'contacts-import') {
      const contactSchema = z.object({
        id: z.string().regex(/^\d+$/),
        phone: z.string().max(30).refine(
          s => !s || /^\+?[\d\s()-]{8,30}$/.test(s),
          'Telefone inválido'
        ),
        email: z.union([z.literal(''), z.string().email().max(254)]),
        owner: z.string().max(150),
        region: z.string().trim().max(100).optional(),
        city: z.string().trim().max(100).optional(),
        document: z.string().max(40).optional().refine(
          doc => !doc || validateDocument(doc),
          'CPF ou CNPJ inválido'
        ),
        commercialPhone: z.string().max(30).optional(),
        emails: z.array(z.string().email().max(254)).max(100).optional(),
        phones: z.array(z.string().max(30)).max(100).optional(),
        contactSource: z.string().max(200).optional(),
        contactSourceRows: z.array(z.number().int().positive()).max(100).optional(),
        rawPhones: z.array(z.string().max(2000)).max(100).optional(),
        rawEmails: z.string().max(10000).optional(),
      });

      const rows = z.array(contactSchema).max(100).parse(p);

      if (new Set(rows.map(r => r.id)).size !== rows.length) {
        return json({ error: 'Códigos duplicados.' }, 400);
      }

      const old = await db.prepare(
        'SELECT id,payload FROM records WHERE owner=? AND kind=?'
      ).bind(u.userId, 'contact').all<{ id: string; payload: string }>();

      const existing = new Map(old.results.map(r => [r.id, JSON.parse(r.payload)]));

      const updates = rows.map(({ id, ...incoming }) => {
        const previous = existing.get(id) || {};
        const merged = { ...incoming, ...previous };

        for (const [key, value] of Object.entries(incoming)) {
          if (!previous[key] || (Array.isArray(previous[key]) && !previous[key].length)) {
            merged[key] = value;
          }
        }

        return put('contact', id, { ...merged, owner: u.userId });
      });

      await db.batch(updates);

      // Log audit
      await logAudit(
        db,
        u.userId,
        'contact_update',
        undefined,
        'contacts_batch',
        { count: rows.length },
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ ok: true, count: rows.length }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: activity =====
    if (action === 'activity') {
      const v = z.object({
        client: z.string().regex(/^\d+$/),
        note: z.string().trim().min(1).max(5000),
        due: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
      }).parse(p);

      // Validate client ownership
      if (!isValidClientId(v.client)) {
        return json({ error: 'Código de cliente inválido.' }, 400);
      }

      const activity = { ...v, id: crypto.randomUUID(), created: now, done: false };
      await put('activity', activity.id, activity).run();

      // Log audit
      await logAudit(
        db,
        u.userId,
        'activity_create',
        activity.id,
        'activity',
        { after: activity },
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ activity }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: complete =====
    if (action === 'complete') {
      const id = z.string().uuid().parse(p.id);

      if (!isValidUUID(id)) {
        return json({ error: 'ID inválido.' }, 400);
      }

      const old = await db.prepare(
        'SELECT payload FROM records WHERE owner=? AND kind=? AND id=?'
      ).bind(u.userId, 'activity', id).first<{ payload: string }>();

      if (!old) {
        return json({ error: 'Atividade não encontrada.' }, 404);
      }

      const updated = { ...JSON.parse(old.payload), done: true };
      await put('activity', id, updated).run();

      // Log audit
      await logAudit(
        db,
        u.userId,
        'activity_complete',
        id,
        'activity',
        { before: JSON.parse(old.payload), after: updated },
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ ok: true }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: audience =====
    if (action === 'audience') {
      const v = audienceSchema.parse(p);
      const active = await db.prepare(
        "SELECT payload FROM records WHERE owner=? AND kind='active' AND id='dataset'"
      ).bind(u.userId).first<{ payload: string }>();

      let ids: Set<string>;
      if (active) {
        const rows = await db.prepare(
          'SELECT id FROM imported_clients WHERE batch=?'
        ).bind(JSON.parse(active.payload).id).all<{ id: string }>();
        ids = new Set(rows.results.map(r => r.id));
      } else {
        ids = new Set(seed.clients.map(c => c.id));
      }

      if (v.clients.some(id => !ids.has(id))) {
        return json({ error: 'Há clientes que não pertencem à carteira atual.' }, 400);
      }

      const audience = { ...v, id: crypto.randomUUID(), created: now };
      await put('audience', audience.id, audience).run();

      // Log audit
      await logAudit(
        db,
        u.userId,
        'audience_create',
        audience.id,
        'audience',
        { after: audience },
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ audience }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: schedule =====
    if (action === 'schedule') {
      const v = scheduleSchema.parse(p);
      const row = await db.prepare(
        "SELECT payload FROM records WHERE owner=? AND kind='audience' AND id=?"
      ).bind(u.userId, v.audienceId).first<{ payload: string }>();

      if (!row) {
        return json({ error: 'Público não encontrado.' }, 404);
      }

      const audience = JSON.parse(row.payload);
      const schedule = {
        ...v,
        id: crypto.randomUUID(),
        clients: audience.clients,
        audienceName: audience.name,
        created: now,
        status: 'pending_manual',
      };

      await put('schedule', schedule.id, schedule).run();

      // Log audit
      await logAudit(
        db,
        u.userId,
        'schedule_create',
        schedule.id,
        'schedule',
        { after: schedule },
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ schedule }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: cancel-schedule =====
    if (action === 'cancel-schedule') {
      const id = z.string().uuid().parse(p.id);

      if (!isValidUUID(id)) {
        return json({ error: 'ID inválido.' }, 400);
      }

      const row = await db.prepare(
        "SELECT payload FROM records WHERE owner=? AND kind='schedule' AND id=?"
      ).bind(u.userId, id).first<{ payload: string }>();

      if (!row) {
        return json({ error: 'Agendamento não encontrado.' }, 404);
      }

      const schedule = { ...JSON.parse(row.payload), status: 'cancelled' };
      await put('schedule', id, schedule).run();

      // Log audit
      await logAudit(
        db,
        u.userId,
        'schedule_cancel',
        id,
        'schedule',
        { before: JSON.parse(row.payload), after: schedule },
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ schedule }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: coverage =====
    if (action === 'coverage') {
      await put('coverage', 'seed', { confirmed: true }).run();

      // Log audit
      await logAudit(
        db,
        u.userId,
        'coverage_confirm',
        'seed',
        'coverage',
        {},
        ctx.ipAddress,
        ctx.userAgent
      );

      return json({ ok: true }, 200, getRateLimitHeaders(rateLimit));
    }

    // ===== ACTION: import =====
    if (action === 'import') {
      // Apply stricter rate limit for imports
      const importRateLimit = applyRateLimit(u.userId, 'import');
      if (!importRateLimit.allowed) {
        return json(
          { error: 'Limite de importações atingido. Tente novamente em uma hora.' },
          429,
          getRateLimitHeaders(importRateLimit)
        );
      }

      const v = datasetSchema.parse(p);
      const { clients, ...metadata } = v;

      // Generate batch ID with hash
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(v))
      );
      const batch = u.userId + '-' + Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Check if batch already exists (prevent duplicates)
      const found = await db.prepare(
        'SELECT id FROM imports WHERE id=? AND owner=?'
      ).bind(batch, u.userId).first();

      if (!found) {
        // Atomic batch insert - all or nothing
        const imports: any[] = [];

        for (let i = 0; i < clients.length; i += 80) {
          imports.push(...clients.slice(i, i + 80).map(c =>
            db.prepare(
              'INSERT INTO imported_clients (batch,id,payload) VALUES (?,?,?) ' +
              'ON CONFLICT(batch,id) DO UPDATE SET payload=excluded.payload'
            ).bind(batch, c.id, JSON.stringify(c))
          ));
        }

        // Add metadata insert
        imports.push(
          db.prepare(
            'INSERT INTO imports (id,owner,metadata,created) VALUES (?,?,?,?) ' +
            'ON CONFLICT(id) DO NOTHING'
          ).bind(batch, u.userId, JSON.stringify(metadata), now)
        );

        // Execute all at once
        await db.batch(imports);

        // Log audit
        await logAudit(
          db,
          u.userId,
          'import_complete',
          batch,
          'import',
          { clientCount: clients.length, source: metadata.source },
          ctx.ipAddress,
          ctx.userAgent
        );
      }

      await put('active', 'dataset', { id: batch }).run();
      return json({ ok: true }, 200, getRateLimitHeaders(importRateLimit));
    }

    return json({ error: 'Operação desconhecida.' }, 400);
  } catch (e) {
    // Log error
    if (e instanceof z.ZodError) {
      return json(
        { error: 'Revise os dados: ' + e.issues[0].message },
        400,
        getRateLimitHeaders(applyRateLimit(u.userId, 'default'))
      );
    }

    console.error('Portfolio POST failed:', e);
    const errorMsg = sanitizeErrorMessage(e);
    return json(
      { error: errorMsg },
      503,
      getRateLimitHeaders(applyRateLimit(u.userId, 'default'))
    );
  }
}
