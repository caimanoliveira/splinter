import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  scheduleLocalNotification,
  cancelLocalNotification,
  getOrRegisterPushToken,
} from '../lib/notifications';
import type { Reminder } from '../types';

interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;

  fetchReminders: () => Promise<void>;
  addReminder: (
    reminder: Omit<Reminder, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'expo_push_token' | 'local_notification_id'>,
  ) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markCompleted: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  loading: false,
  error: null,

  fetchReminders: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('reminders')
      .select('*, pet:pets(id, name, species)')
      .order('remind_at', { ascending: true });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ reminders: (data as Reminder[]) ?? [], loading: false });
  },

  addReminder: async (reminder) => {
    set({ loading: true, error: null });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Schedule local notification
    let localNotificationId: string | null = null;
    try {
      localNotificationId = await scheduleLocalNotification({
        title: reminder.title,
        body: reminder.description ?? `Reminder for your pet`,
        triggerDate: new Date(reminder.remind_at),
      });
    } catch (e) {
      console.warn('[Reminders] Could not schedule local notification', e);
    }

    // Get push token (best-effort)
    const expoPushToken = await getOrRegisterPushToken().catch(() => null);

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        ...reminder,
        owner_id: user.id,
        local_notification_id: localNotificationId,
        expo_push_token: expoPushToken,
      })
      .select('*, pet:pets(id, name, species)')
      .single();

    if (error) {
      // Roll back scheduled notification if DB insert fails
      if (localNotificationId) {
        cancelLocalNotification(localNotificationId).catch(() => null);
      }
      set({ loading: false, error: error.message });
      throw error;
    }

    set((s) => ({ reminders: [data as Reminder, ...s.reminders], loading: false }));
  },

  updateReminder: async (id, updates) => {
    const existing = get().reminders.find((r) => r.id === id);

    // Re-schedule notification if time changed
    if (updates.remind_at && existing?.local_notification_id) {
      await cancelLocalNotification(existing.local_notification_id).catch(() => null);
      try {
        const newNotifId = await scheduleLocalNotification({
          title: updates.title ?? existing.title,
          body: updates.description ?? existing.description ?? '',
          triggerDate: new Date(updates.remind_at),
        });
        updates = { ...updates, local_notification_id: newNotifId };
      } catch (e) {
        console.warn('[Reminders] Could not reschedule notification', e);
      }
    }

    const { data, error } = await supabase
      .from('reminders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, pet:pets(id, name, species)')
      .single();

    if (error) throw error;

    set((s) => ({
      reminders: s.reminders.map((r) => (r.id === id ? (data as Reminder) : r)),
    }));
  },

  deleteReminder: async (id) => {
    const existing = get().reminders.find((r) => r.id === id);
    if (existing?.local_notification_id) {
      await cancelLocalNotification(existing.local_notification_id).catch(() => null);
    }

    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;

    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
  },

  markCompleted: async (id) => {
    await get().updateReminder(id, { is_completed: true });
  },

  clearError: () => set({ error: null }),
}));
