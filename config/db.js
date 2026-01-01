import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  : null;

export async function initDb() {
  if (!pool) return;
  await pool.query(`
    create table if not exists categories (
      id serial primary key,
      title text unique not null,
      project_count integer not null default 0
    );
  `);

  await pool.query(`
    create table if not exists projects (
      id serial primary key,
      title text not null,
      description text,
      author text,
      university text,
      department text,
      year integer,
      type text,
      category text not null,
      subject text,
      pages integer,
      language text,
      price numeric,
      rating numeric,
      downloads integer default 0,
      tags jsonb,
      abstract text,
      table_of_contents jsonb,
      upload_date timestamptz,
      file_size integer,
      format text,
      status text default 'Unpublished',
      created_at timestamptz not null default now()
    );
  `);
}
