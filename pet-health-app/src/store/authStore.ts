/**
 * authStore — profile metadata stored in our Neon DB.
 *
 * Session / user state is owned by Clerk — use the hooks from src/lib/auth.ts
 * (useAuth, useUser) for sign-in status and identity.
 *
 * This store handles the one thing Clerk doesn't store: the "profile" row in
 * our own `users` table so the rest of the app can JOIN against it.
 */
import { create } from 'zustand';
import { sql } from '../lib/db';
import type { Profile } from '../types';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;

  /** Upsert a profile row for the given Clerk user ID. */
  syncProfile: (userId: string, fullName: string | null) => Promise<void>;
  /** Fetch the stored profile for the current user. */
  fetchProfile: (userId: string) => Promise<void>;
  clearProfile: () => void;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  syncProfile: async (userId, fullName) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        INSERT INTO users (id, full_name, updated_at)
        VALUES (${userId}, ${fullName}, NOW())
        ON CONFLICT (id) DO UPDATE
          SET full_name  = COALESCE(EXCLUDED.full_name, users.full_name),
              updated_at = NOW()
        RETURNING *
      `;
      set({ profile: rows[0] as Profile, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  fetchProfile: async (userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
      set({ profile: (rows[0] as Profile) ?? null, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  clearProfile: () => set({ profile: null }),
  clearError: () => set({ error: null }),
}));
