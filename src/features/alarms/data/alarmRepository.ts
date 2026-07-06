import type { Alarm } from '../domain/alarm';

export interface AlarmRepository {
  initialize(): Promise<void>;
  list(): Promise<Alarm[]>;
  get(id: string): Promise<Alarm | null>;
  save(alarm: Alarm): Promise<void>;
  remove(id: string): Promise<void>;
}
