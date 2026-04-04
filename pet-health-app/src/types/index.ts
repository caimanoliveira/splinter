// ============================================================
// Domain types — mirror the Supabase schema
// ============================================================

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other';

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: Species;
  breed: string | null;
  birthdate: string | null;  // ISO date string
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  pet_id: string;
  owner_id: string;
  weight_kg: number;
  logged_at: string;  // ISO date string
  notes: string | null;
  created_at: string;
}

export type HealthRecordType = 'vaccine' | 'consultation' | 'exam' | 'surgery' | 'other';

export interface HealthRecord {
  id: string;
  pet_id: string;
  owner_id: string;
  record_type: HealthRecordType;
  title: string;
  description: string | null;
  veterinarian: string | null;
  record_date: string;  // ISO date string
  attachment_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Vet {
  id: string;
  owner_id: string;
  name: string;
  clinic: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  owner_id: string;
  pet_id: string;
  vet_id: string | null;
  title: string;
  description: string | null;
  appointment_at: string;  // ISO datetime string
  status: AppointmentStatus;
  location: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  pet?: Pet;
  vet?: Vet;
}

export type ReminderType = 'vaccine' | 'consultation' | 'medication' | 'exam' | 'other';

export interface Reminder {
  id: string;
  owner_id: string;
  pet_id: string;
  title: string;
  description: string | null;
  reminder_type: ReminderType;
  remind_at: string;  // ISO datetime string
  is_recurring: boolean;
  recurrence_days: number | null;
  expo_push_token: string | null;
  local_notification_id: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  pet?: Pet;
}

// ============================================================
// Navigation param lists
// ============================================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Pets: undefined;
  Reminders: undefined;
  Appointments: undefined;
  Vets: undefined;
};

export type PetsStackParamList = {
  PetList: undefined;
  PetDetail: { petId: string };
  AddEditPet: { petId?: string };
  HealthRecords: { petId: string; petName: string };
  AddRecord: { petId: string; recordId?: string };
  RecordDetail: { recordId: string };
};

export type RemindersStackParamList = {
  ReminderList: undefined;
  AddReminder: { reminderId?: string; petId?: string };
};

export type VetsStackParamList = {
  VetRegistry: undefined;
  VetDetail: { vetId: string };
  AddEditVet: { vetId?: string };
};

export type AppointmentsStackParamList = {
  AppointmentCalendar: undefined;
  AddAppointment: { appointmentId?: string };
};
