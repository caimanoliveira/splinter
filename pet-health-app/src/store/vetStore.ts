import { create } from 'zustand';
import { sql } from '../lib/db';
import type { Vet, Appointment } from '../types';

interface VetState {
  vets: Vet[];
  appointments: Appointment[];
  loading: boolean;
  error: string | null;

  fetchVets: (userId: string) => Promise<void>;
  addVet: (vet: Omit<Vet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>, userId: string) => Promise<Vet>;
  updateVet: (id: string, updates: Partial<Vet>, userId: string) => Promise<void>;
  deleteVet: (id: string, userId: string) => Promise<void>;

  fetchAppointments: (userId: string) => Promise<void>;
  addAppointment: (
    appt: Omit<Appointment, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'pet' | 'vet'>,
    userId: string,
  ) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>, userId: string) => Promise<void>;
  deleteAppointment: (id: string, userId: string) => Promise<void>;

  clearError: () => void;
}

export const useVetStore = create<VetState>((set) => ({
  vets: [],
  appointments: [],
  loading: false,
  error: null,

  // ── Vets ─────────────────────────────────────────────────

  fetchVets: async (userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        SELECT * FROM vets WHERE owner_id = ${userId} ORDER BY name ASC
      `;
      set({ vets: rows as Vet[], loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  addVet: async (vet, userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        INSERT INTO vets (owner_id, name, clinic, phone, email, specialty, notes)
        VALUES (${userId}, ${vet.name}, ${vet.clinic ?? null}, ${vet.phone ?? null},
                ${vet.email ?? null}, ${vet.specialty ?? null}, ${vet.notes ?? null})
        RETURNING *
      `;
      const newVet = rows[0] as Vet;
      set((s) => ({ vets: [...s.vets, newVet], loading: false }));
      return newVet;
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  updateVet: async (id, updates, userId) => {
    const rows = await sql`
      UPDATE vets SET
        name       = COALESCE(${updates.name ?? null}, name),
        clinic     = ${updates.clinic ?? null},
        phone      = ${updates.phone ?? null},
        email      = ${updates.email ?? null},
        specialty  = ${updates.specialty ?? null},
        notes      = ${updates.notes ?? null},
        updated_at = NOW()
      WHERE id = ${id} AND owner_id = ${userId}
      RETURNING *
    `;
    set((s) => ({
      vets: s.vets.map((v) => (v.id === id ? (rows[0] as Vet) : v)),
    }));
  },

  deleteVet: async (id, userId) => {
    await sql`DELETE FROM vets WHERE id = ${id} AND owner_id = ${userId}`;
    set((s) => ({ vets: s.vets.filter((v) => v.id !== id) }));
  },

  // ── Appointments ─────────────────────────────────────────

  fetchAppointments: async (userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        SELECT
          a.*,
          row_to_json(p.*) AS pet,
          row_to_json(v.*) AS vet
        FROM appointments a
        LEFT JOIN pets p ON p.id = a.pet_id
        LEFT JOIN vets v ON v.id = a.vet_id
        WHERE a.owner_id = ${userId}
        ORDER BY a.appointment_at ASC
      `;
      set({ appointments: rows as Appointment[], loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  addAppointment: async (appt, userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        INSERT INTO appointments
          (owner_id, pet_id, vet_id, title, description, appointment_at, status, location)
        VALUES
          (${userId}, ${appt.pet_id}, ${appt.vet_id ?? null}, ${appt.title},
           ${appt.description ?? null}, ${appt.appointment_at}, ${appt.status}, ${appt.location ?? null})
        RETURNING *
      `;

      const withJoins = await sql`
        SELECT a.*, row_to_json(p.*) AS pet, row_to_json(v.*) AS vet
        FROM appointments a
        LEFT JOIN pets p ON p.id = a.pet_id
        LEFT JOIN vets v ON v.id = a.vet_id
        WHERE a.id = ${(rows[0] as { id: string }).id}
      `;

      const newAppt = withJoins[0] as Appointment;
      set((s) => ({
        appointments: [...s.appointments, newAppt].sort((a, b) =>
          a.appointment_at.localeCompare(b.appointment_at),
        ),
        loading: false,
      }));
      return newAppt;
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  updateAppointment: async (id, updates, userId) => {
    const rows = await sql`
      UPDATE appointments SET
        title          = COALESCE(${updates.title ?? null}, title),
        description    = ${updates.description ?? null},
        pet_id         = COALESCE(${updates.pet_id ?? null}, pet_id),
        vet_id         = ${updates.vet_id ?? null},
        appointment_at = COALESCE(${updates.appointment_at ?? null}, appointment_at),
        status         = COALESCE(${updates.status ?? null}, status),
        location       = ${updates.location ?? null},
        updated_at     = NOW()
      WHERE id = ${id} AND owner_id = ${userId}
      RETURNING *
    `;

    const withJoins = await sql`
      SELECT a.*, row_to_json(p.*) AS pet, row_to_json(v.*) AS vet
      FROM appointments a
      LEFT JOIN pets p ON p.id = a.pet_id
      LEFT JOIN vets v ON v.id = a.vet_id
      WHERE a.id = ${(rows[0] as { id: string }).id}
    `;

    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === id ? (withJoins[0] as Appointment) : a,
      ),
    }));
  },

  deleteAppointment: async (id, userId) => {
    await sql`DELETE FROM appointments WHERE id = ${id} AND owner_id = ${userId}`;
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
