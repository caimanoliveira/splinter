import { create } from 'zustand';
import { sql } from '../lib/db';
import type { Pet, WeightLog, HealthRecord } from '../types';

interface PetState {
  pets: Pet[];
  activePet: Pet | null;
  weightLogs: Record<string, WeightLog[]>;
  healthRecords: Record<string, HealthRecord[]>;
  loading: boolean;
  error: string | null;

  fetchPets: (userId: string) => Promise<void>;
  fetchPet: (petId: string, userId: string) => Promise<void>;
  addPet: (pet: Omit<Pet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>, userId: string) => Promise<Pet>;
  updatePet: (petId: string, updates: Partial<Pet>, userId: string) => Promise<void>;
  deletePet: (petId: string, userId: string) => Promise<void>;
  setActivePet: (pet: Pet | null) => void;

  fetchWeightLogs: (petId: string, userId: string) => Promise<void>;
  addWeightLog: (log: Omit<WeightLog, 'id' | 'owner_id' | 'created_at'>, userId: string) => Promise<void>;
  deleteWeightLog: (logId: string, petId: string, userId: string) => Promise<void>;

  fetchHealthRecords: (petId: string, userId: string) => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'owner_id' | 'created_at' | 'updated_at'>, userId: string) => Promise<HealthRecord>;
  updateHealthRecord: (recordId: string, updates: Partial<HealthRecord>, petId: string, userId: string) => Promise<void>;
  deleteHealthRecord: (recordId: string, petId: string, userId: string) => Promise<void>;

  clearError: () => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  activePet: null,
  weightLogs: {},
  healthRecords: {},
  loading: false,
  error: null,

  // ── Pets ──────────────────────────────────────────────────

  fetchPets: async (userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        SELECT * FROM pets
        WHERE owner_id = ${userId}
        ORDER BY created_at DESC
      `;
      set({ pets: rows as Pet[], loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  fetchPet: async (petId, userId) => {
    const rows = await sql`
      SELECT * FROM pets WHERE id = ${petId} AND owner_id = ${userId}
    `;
    if (rows[0]) set({ activePet: rows[0] as Pet });
  },

  addPet: async (pet, userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        INSERT INTO pets (owner_id, name, species, breed, birthdate, photo_url)
        VALUES (${userId}, ${pet.name}, ${pet.species}, ${pet.breed ?? null},
                ${pet.birthdate ?? null}, ${pet.photo_url ?? null})
        RETURNING *
      `;
      const newPet = rows[0] as Pet;
      set((s) => ({ pets: [newPet, ...s.pets], loading: false }));
      return newPet;
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  updatePet: async (petId, updates, userId) => {
    set({ loading: true });
    try {
      const rows = await sql`
        UPDATE pets SET
          name       = COALESCE(${updates.name ?? null}, name),
          species    = COALESCE(${updates.species ?? null}, species),
          breed      = ${updates.breed ?? null},
          birthdate  = ${updates.birthdate ?? null},
          photo_url  = ${updates.photo_url ?? null},
          updated_at = NOW()
        WHERE id = ${petId} AND owner_id = ${userId}
        RETURNING *
      `;
      const updated = rows[0] as Pet;
      set((s) => ({
        pets: s.pets.map((p) => (p.id === petId ? updated : p)),
        activePet: s.activePet?.id === petId ? updated : s.activePet,
        loading: false,
      }));
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  deletePet: async (petId, userId) => {
    set({ loading: true });
    try {
      await sql`DELETE FROM pets WHERE id = ${petId} AND owner_id = ${userId}`;
      set((s) => ({ pets: s.pets.filter((p) => p.id !== petId), loading: false }));
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  setActivePet: (pet) => set({ activePet: pet }),

  // ── Weight logs ──────────────────────────────────────────

  fetchWeightLogs: async (petId, userId) => {
    try {
      const rows = await sql`
        SELECT * FROM weight_logs
        WHERE pet_id = ${petId} AND owner_id = ${userId}
        ORDER BY logged_at ASC
      `;
      set((s) => ({ weightLogs: { ...s.weightLogs, [petId]: rows as WeightLog[] } }));
    } catch (err) {
      console.error('[petStore] fetchWeightLogs', err);
    }
  },

  addWeightLog: async (log, userId) => {
    const rows = await sql`
      INSERT INTO weight_logs (pet_id, owner_id, weight_kg, logged_at, notes)
      VALUES (${log.pet_id}, ${userId}, ${log.weight_kg}, ${log.logged_at}, ${log.notes ?? null})
      RETURNING *
    `;
    const newLog = rows[0] as WeightLog;
    set((s) => {
      const existing = s.weightLogs[log.pet_id] ?? [];
      return {
        weightLogs: {
          ...s.weightLogs,
          [log.pet_id]: [...existing, newLog].sort((a, b) =>
            a.logged_at.localeCompare(b.logged_at),
          ),
        },
      };
    });
  },

  deleteWeightLog: async (logId, petId, userId) => {
    await sql`DELETE FROM weight_logs WHERE id = ${logId} AND owner_id = ${userId}`;
    set((s) => ({
      weightLogs: {
        ...s.weightLogs,
        [petId]: (s.weightLogs[petId] ?? []).filter((l) => l.id !== logId),
      },
    }));
  },

  // ── Health records ───────────────────────────────────────

  fetchHealthRecords: async (petId, userId) => {
    try {
      const rows = await sql`
        SELECT * FROM health_records
        WHERE pet_id = ${petId} AND owner_id = ${userId}
        ORDER BY record_date DESC
      `;
      set((s) => ({ healthRecords: { ...s.healthRecords, [petId]: rows as HealthRecord[] } }));
    } catch (err) {
      console.error('[petStore] fetchHealthRecords', err);
    }
  },

  addHealthRecord: async (record, userId) => {
    const rows = await sql`
      INSERT INTO health_records
        (pet_id, owner_id, record_type, title, description, veterinarian, record_date, attachment_urls)
      VALUES
        (${record.pet_id}, ${userId}, ${record.record_type}, ${record.title},
         ${record.description ?? null}, ${record.veterinarian ?? null},
         ${record.record_date}, ${record.attachment_urls ?? null})
      RETURNING *
    `;
    const newRecord = rows[0] as HealthRecord;
    set((s) => {
      const existing = s.healthRecords[record.pet_id] ?? [];
      return { healthRecords: { ...s.healthRecords, [record.pet_id]: [newRecord, ...existing] } };
    });
    return newRecord;
  },

  updateHealthRecord: async (recordId, updates, petId, userId) => {
    const rows = await sql`
      UPDATE health_records SET
        record_type     = COALESCE(${updates.record_type ?? null}, record_type),
        title           = COALESCE(${updates.title ?? null}, title),
        description     = ${updates.description ?? null},
        veterinarian    = ${updates.veterinarian ?? null},
        record_date     = COALESCE(${updates.record_date ?? null}, record_date),
        attachment_urls = ${updates.attachment_urls ?? null},
        updated_at      = NOW()
      WHERE id = ${recordId} AND owner_id = ${userId}
      RETURNING *
    `;
    const updated = rows[0] as HealthRecord;
    set((s) => ({
      healthRecords: {
        ...s.healthRecords,
        [petId]: (s.healthRecords[petId] ?? []).map((r) =>
          r.id === recordId ? updated : r,
        ),
      },
    }));
  },

  deleteHealthRecord: async (recordId, petId, userId) => {
    await sql`DELETE FROM health_records WHERE id = ${recordId} AND owner_id = ${userId}`;
    set((s) => ({
      healthRecords: {
        ...s.healthRecords,
        [petId]: (s.healthRecords[petId] ?? []).filter((r) => r.id !== recordId),
      },
    }));
  },

  clearError: () => set({ error: null }),
}));
