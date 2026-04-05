import { neon } from '@neondatabase/serverless';

// EXPO_PUBLIC_ prefix makes the var available at build time in Expo (SDK 49+).
// The Neon HTTP driver uses fetch() under the hood — compatible with React Native.
const databaseUrl = process.env['EXPO_PUBLIC_DATABASE_URL'] ?? '';

if (!databaseUrl) {
  console.warn(
    '[DB] Missing EXPO_PUBLIC_DATABASE_URL. Copy .env.example to .env and fill in your Neon connection string.',
  );
}

/**
 * `sql` is a tagged-template SQL function that sends queries over HTTP to Neon.
 *
 * Usage:
 *   const rows = await sql`SELECT * FROM pets WHERE owner_id = ${userId}`;
 *
 * Parameters are always sent as $1, $2… placeholders — never interpolated as
 * raw strings, so SQL injection is not possible.
 */
export const sql = neon(databaseUrl);
