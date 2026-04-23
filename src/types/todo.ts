export type TodoStatus = 'pending' | 'in_progress' | 'done' | 'blocked';
export type TodoPriority = 'p0' | 'p1' | 'p2' | 'p3';

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  assigned_agent: string | null;
  created_at: string;
  updated_at: string;
}
