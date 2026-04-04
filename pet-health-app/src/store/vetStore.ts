import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Vet, Appointment } from '../types';

interface VetState {
  vets: Vet[];
  appointments: Appointment[];
  loading: boolean;
  error: string | null;

  fetchVets: () => Promise<void>;
  addVet: (vet: Omit<Vet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<Vet>;
  updateVet: (id: string, updates: Partial<Vet>) => Promise<void>;
  deleteVet: (id: string) => Promise<void>;

  fetchAppointments: () => Promise<void>;
  addAppointment: (
    appt: Omit<Appointment, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'pet' | 'vet'>,
  ) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useVetStore = create<VetState>((set) => ({
  vets: [],
  appointments: [],
  loading: false,
  error: null,

  fetchVets: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('vets')
      .select('*')
      .order('name');

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ vets: (data as Vet[]) ?? [], loading: false });
  },

  addVet: async (vet) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('vets')
      .insert({ ...vet, owner_id: user.id })
      .select()
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    const newVet = data as Vet;
    set((s) => ({ vets: [...s.vets, newVet], loading: false }));
    return newVet;
  },

  updateVet: async (id, updates) => {
    const { data, error } = await supabase
      .from('vets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    set((s) => ({
      vets: s.vets.map((v) => (v.id === id ? (data as Vet) : v)),
    }));
  },

  deleteVet: async (id) => {
    const { error } = await supabase.from('vets').delete().eq('id', id);
    if (error) throw error;
    set((s) => ({ vets: s.vets.filter((v) => v.id !== id) }));
  },

  // ── Appointments ─────────────────────────────────────────

  fetchAppointments: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('appointments')
      .select('*, pet:pets(id, name, species), vet:vets(id, name, clinic)')
      .order('appointment_at', { ascending: true });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ appointments: (data as Appointment[]) ?? [], loading: false });
  },

  addAppointment: async (appt) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...appt, owner_id: user.id })
      .select('*, pet:pets(id, name, species), vet:vets(id, name, clinic)')
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    const newAppt = data as Appointment;
    set((s) => ({
      appointments: [...s.appointments, newAppt].sort((a, b) =>
        a.appointment_at.localeCompare(b.appointment_at),
      ),
      loading: false,
    }));
    return newAppt;
  },

  updateAppointment: async (id, updates) => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, pet:pets(id, name, species), vet:vets(id, name, clinic)')
      .single();

    if (error) throw error;
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? (data as Appointment) : a)),
    }));
  },

  deleteAppointment: async (id) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
