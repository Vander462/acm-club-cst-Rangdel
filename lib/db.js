import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const file = process.env.DB_PATH || path.join(process.cwd(), "data", "zhabto.db");

function init() {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new Database(file);
  d.pragma("journal_mode = WAL");
  d.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      code           TEXT NOT NULL UNIQUE,
      service        TEXT NOT NULL,
      service_name   TEXT NOT NULL,
      name           TEXT NOT NULL,
      student_id     TEXT NOT NULL,
      phone          TEXT NOT NULL,
      place          TEXT NOT NULL,
      preferred_date TEXT NOT NULL DEFAULT '',
      laptop_model   TEXT NOT NULL DEFAULT '',
      notes          TEXT NOT NULL DEFAULT '',
      details        TEXT NOT NULL DEFAULT '',
      quantity       INTEGER NOT NULL DEFAULT 1,
      cost           INTEGER NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'pending',
      admin_note     TEXT NOT NULL DEFAULT '',
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL,
      confirmed_at   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
  `);
  return d;
}

// Reuse one connection across hot reloads in development
export const db = globalThis.__zhabtoDb ?? (globalThis.__zhabtoDb = init());

export function mapRow(r) {
  return {
    id: r.id,
    code: r.code,
    service: r.service,
    serviceName: r.service_name,
    name: r.name,
    studentId: r.student_id,
    phone: r.phone,
    place: r.place,
    preferredDate: r.preferred_date,
    laptopModel: r.laptop_model,
    notes: r.notes,
    details: r.details,
    quantity: r.quantity,
    cost: r.cost,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    confirmedAt: r.confirmed_at,
  };
}

export function listAll() {
  return db.prepare("SELECT * FROM requests ORDER BY created_at DESC").all().map(mapRow);
}

export function getById(id) {
  const r = db.prepare("SELECT * FROM requests WHERE id = ?").get(id);
  return r ? mapRow(r) : null;
}
