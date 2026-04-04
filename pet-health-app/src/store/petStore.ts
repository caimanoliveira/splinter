import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Pet, WeightLog, HealthRecord } from '../types';

interface PetState {
  pets: Pet[];
  activePet: Pet | null;
  weightLogs: Record<string, WeightLog[]>;   // keyed by pet_id
  healthRecords: Record<string, HealthRecord[]>;  // keyed by pet_id
  loading: boolean;
  error: string | null;

  fetchPets: () => Promise<void>;
  fetchPet: (petId: string) => Promise<void>;
  addPet: (pet: Omit<Pet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<Pet>;
  updatePet: (petId: string, updates: Partial<Pet>) => Promise<void>;
  deletePet: (petId: string) => Promise<void>;
  setActivePet: (pet: Pet | null) => void;

  fetchWeightLogs: (petId: string) => Promise<void>;
  addWeightLog: (log: Omit<WeightLog, 'id' | 'owner_id' | 'created_at'>) => Promise<void>;
  deleteWeightLog: (logId: string, petId: string) => Promise<void>;

  fetchHealthRecords: (petId: string) => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<HealthRecord>;
  updateHealthRecord: (recordId: string, updates: Partial<HealthRecord>, petId: string) => Promise<void>;
  deleteHealthRecord: (recordId: string, petId: string) => Promise<void>;

  clearError: () => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  activePet: null,
  weightLogs: {},
  healthRecords: {},
  loading: false,
  error: null,

  fetchPets: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ pets: (data as Pet[]) ?? [], loading: false });
  },

  fetchPet: async (petId) => {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();

    if (!error && data) {
      set({ activePet: data as Pet });
    }
  },

  addPet: async (pet) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pets')
      .insert({ ...pet, owner_id: user.id })
      .select()
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    const newPet = data as Pet;
    set((s) => ({ pets: [newPet, ...s.pets], loading: false }));
    return newPet;
  },

  updatePet: async (petId, updates) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('pets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', petId)
      .select()
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    const updated = data as Pet;
    set((s) => ({
      pets: s.pets.map((p) => (p.id === petId ? updated : p)),
      activePet: s.activePet?.id === petId ? updated : s.activePet,
      loading: false,
    }));
  },

  deletePet: async (petId) => {
    set({ loading: true });
    const { error } = await supabase.from('pets').delete().eq('id', petId);
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    set((s) => ({
      pets: s.pets.filter((p) => p.id !== petId),
      loading: false,
    }));
  },

  setActivePet: (pet) => set({ activePet: pet }),

  // ── Weight logs ──────────────────────────────────────────

  fetchWeightLogs: async (petId) => {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('pet_id', petId)
      .order('logged_at', { ascending: true });

    if (!error) {
      set((s) => ({
        weightLogs: { ...s.weightLogs, [petId]: (data as WeightLog[]) ?? [] },
      }));
    }
  },

  addWeightLog: async (log) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('weight_logs')
      .insert({ ...log, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    const newLog = data as WeightLog;
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

  deleteWeightLog: async (logId, petId) => {
    const { error } = await supabase.from('weight_logs').delete().eq('id', logId);
    if (error) throw error;
    set((s) => ({
      weightLogs: {
        ...s.weightLogs,
        [petId]: (s.weightLogs[petId] ?? []).filter((l) => l.id !== logId),
      },
    }));
  },

  // ── Health records ───────────────────────────────────────

  fetchHealthRecords: async (petId) => {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('pet_id', petId)
      .order('record_date', { ascending: false });

    if (!error) {
      set((s) => ({
        healthRecords: { ...s.healthRecords, [petId]: (data as HealthRecord[]) ?? [] },
      }));
    }
  },

  addHealthRecord: async (record) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('health_records')
      .insert({ ...record, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    const newRecord = data as HealthRecord;
    set((s) => {
      const existing = s.healthRecords[record.pet_id] ?? [];
      return {
        healthRecords: {
          ...s.healthRecords,
          [record.pet_id]: [newRecord, ...existing],
        },
      };
    });
    return newRecord;
  },

  updateHealthRecord: async (recordId, updates, petId) => {
    const { data, error } = await supabase
      .from('health_records')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;

    const updated = data as HealthRecord;
    set((s) => ({
      healthRecords: {
        ...s.healthRecords,
        [petId]: (s.healthRecords[petId] ?? []).map((r) =>
          r.id === recordId ? updated : r,
        ),
      },
    }));
  },

  deleteHealthRecord: async (recordId, petId) => {
    const { error } = await supabase.from('health_records').delete().eq('id', recordId);
    if (error) throw error;
    set((s) => ({
      healthRecords: {
        ...s.healthRecords,
        [petId]: (s.healthRecords[petId] ?? []).filter((r) => r.id !== recordId),
      },
    }));
  },

  clearError: () => set({ error: null }),
}));
