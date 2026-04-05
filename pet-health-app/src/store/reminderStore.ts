import { create } from 'zustand';
import { sql } from '../lib/db';
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

  fetchReminders: (userId: string) => Promise<void>;
  addReminder: (
    reminder: Omit<Reminder, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'expo_push_token' | 'local_notification_id'>,
    userId: string,
  ) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>, userId: string) => Promise<void>;
  deleteReminder: (id: string, userId: string) => Promise<void>;
  markCompleted: (id: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  loading: false,
  error: null,

  fetchReminders: async (userId) => {
    set({ loading: true, error: null });
    try {
      const rows = await sql`
        SELECT r.*, row_to_json(p.*) AS pet
        FROM reminders r
        LEFT JOIN pets p ON p.id = r.pet_id
        WHERE r.owner_id = ${userId}
        ORDER BY r.remind_at ASC
      `;
      set({ reminders: rows as Reminder[], loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  addReminder: async (reminder, userId) => {
    set({ loading: true, error: null });

    let localNotificationId: string | null = null;
    try {
      localNotificationId = await scheduleLocalNotification({
        title: reminder.title,
        body: reminder.description ?? 'Pet health reminder',
        triggerDate: new Date(reminder.remind_at),
      });
    } catch (e) {
      console.warn('[Reminders] Could not schedule local notification', e);
    }

    const expoPushToken = await getOrRegisterPushToken().catch(() => null);

    try {
      const rows = await sql`
        INSERT INTO reminders
          (owner_id, pet_id, title, description, reminder_type, remind_at,
           is_recurring, recurrence_days, expo_push_token, local_notification_id, is_completed)
        VALUES
          (${userId}, ${reminder.pet_id}, ${reminder.title}, ${reminder.description ?? null},
           ${reminder.reminder_type}, ${reminder.remind_at},
           ${reminder.is_recurring}, ${reminder.recurrence_days ?? null},
           ${expoPushToken}, ${localNotificationId}, false)
        RETURNING *
      `;

      // Re-fetch with pet join
      const withPet = await sql`
        SELECT r.*, row_to_json(p.*) AS pet
        FROM reminders r
        LEFT JOIN pets p ON p.id = r.pet_id
        WHERE r.id = ${(rows[0] as { id: string }).id}
      `;

      set((s) => ({ reminders: [withPet[0] as Reminder, ...s.reminders], loading: false }));
    } catch (err) {
      if (localNotificationId) {
        cancelLocalNotification(localNotificationId).catch(() => null);
      }
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  updateReminder: async (id, updates, userId) => {
    const existing = get().reminders.find((r) => r.id === id);

    // Reschedule notification if time changed
    let newNotifId = existing?.local_notification_id ?? null;
    if (updates.remind_at && existing?.local_notification_id) {
      await cancelLocalNotification(existing.local_notification_id).catch(() => null);
      try {
        newNotifId = await scheduleLocalNotification({
          title: updates.title ?? existing.title,
          body: updates.description ?? existing.description ?? '',
          triggerDate: new Date(updates.remind_at),
        });
      } catch {
        newNotifId = null;
      }
    }

    const rows = await sql`
      UPDATE reminders SET
        title                 = COALESCE(${updates.title ?? null}, title),
        description           = ${updates.description ?? null},
        reminder_type         = COALESCE(${updates.reminder_type ?? null}, reminder_type),
        remind_at             = COALESCE(${updates.remind_at ?? null}, remind_at),
        is_recurring          = COALESCE(${updates.is_recurring ?? null}, is_recurring),
        recurrence_days       = ${updates.recurrence_days ?? null},
        local_notification_id = ${newNotifId},
        is_completed          = COALESCE(${updates.is_completed ?? null}, is_completed),
        updated_at            = NOW()
      WHERE id = ${id} AND owner_id = ${userId}
      RETURNING *
    `;

    const withPet = await sql`
      SELECT r.*, row_to_json(p.*) AS pet
      FROM reminders r LEFT JOIN pets p ON p.id = r.pet_id
      WHERE r.id = ${(rows[0] as { id: string }).id}
    `;

    set((s) => ({
      reminders: s.reminders.map((r) => (r.id === id ? (withPet[0] as Reminder) : r)),
    }));
  },

  deleteReminder: async (id, userId) => {
    const existing = get().reminders.find((r) => r.id === id);
    if (existing?.local_notification_id) {
      await cancelLocalNotification(existing.local_notification_id).catch(() => null);
    }
    await sql`DELETE FROM reminders WHERE id = ${id} AND owner_id = ${userId}`;
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
  },

  markCompleted: async (id, userId) => {
    await get().updateReminder(id, { is_completed: true }, userId);
  },

  clearError: () => set({ error: null }),
}));
