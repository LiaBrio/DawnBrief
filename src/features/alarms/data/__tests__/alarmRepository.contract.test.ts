import type { Alarm } from '../../domain/alarm';
import type { AlarmRepository } from '../alarmRepository';
import { SQLiteAlarmRepository } from '../sqliteAlarmRepository';

const morningAlarm: Alarm = {
  id: 'morning',
  label: 'Morning',
  hour: 7,
  minute: 30,
  enabled: true,
  repeat: { kind: 'daily' },
  sound: 'aurora',
  snoozeMinutes: 10,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

class MemoryAlarmRepository implements AlarmRepository {
  private readonly alarms = new Map<string, Alarm>();

  async initialize(): Promise<void> {}

  async list(): Promise<Alarm[]> {
    return [...this.alarms.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Alarm | null> {
    return this.alarms.get(id) ?? null;
  }

  async save(alarm: Alarm): Promise<void> {
    this.alarms.set(alarm.id, alarm);
  }

  async remove(id: string): Promise<void> {
    this.alarms.delete(id);
  }
}

function alarmRepositoryContract(name: string, create: () => AlarmRepository): void {
  describe(name, () => {
    let repository: AlarmRepository;

    beforeEach(async () => {
      repository = create();
      await repository.initialize();
    });

    it('supports idempotent initialization and starts empty', async () => {
      await repository.initialize();
      await expect(repository.list()).resolves.toEqual([]);
    });

    it('saves, gets, and lists alarms newest update first', async () => {
      const later = {
        ...morningAlarm,
        id: 'later',
        updatedAt: '2026-07-02T00:00:00.000Z',
      };

      await repository.save(morningAlarm);
      await repository.save(later);

      await expect(repository.get(morningAlarm.id)).resolves.toEqual(morningAlarm);
      await expect(repository.get('missing')).resolves.toBeNull();
      await expect(repository.list()).resolves.toEqual([later, morningAlarm]);
    });

    it('updates an alarm with the same id', async () => {
      const updated = { ...morningAlarm, label: 'Updated', minute: 45 };
      await repository.save(morningAlarm);
      await repository.save(updated);

      await expect(repository.get(morningAlarm.id)).resolves.toEqual(updated);
      await expect(repository.list()).resolves.toEqual([updated]);
    });

    it('removes an alarm and tolerates removing a missing id', async () => {
      await repository.save(morningAlarm);
      await repository.remove(morningAlarm.id);
      await repository.remove('missing');

      await expect(repository.get(morningAlarm.id)).resolves.toBeNull();
      await expect(repository.list()).resolves.toEqual([]);
    });
  });
}

alarmRepositoryContract('AlarmRepository contract (memory)', () => new MemoryAlarmRepository());

type Row = { id: string; payload: string; updated_at: string };

class FakeSQLiteDatabase {
  readonly execCalls: string[] = [];
  readonly runCalls: Array<{ sql: string; params: unknown[] }> = [];
  readonly getAllCalls: Array<{ sql: string; params: unknown[] }> = [];
  readonly getFirstCalls: Array<{ sql: string; params: unknown[] }> = [];
  readonly rows = new Map<string, Row>();

  async execAsync(sql: string): Promise<void> {
    this.execCalls.push(sql);
  }

  async runAsync(
    sql: string,
    ...params: unknown[]
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    this.runCalls.push({ sql, params });
    if (/^\s*INSERT/i.test(sql)) {
      const [id, payload, updatedAt] = params as [string, string, string];
      this.rows.set(id, { id, payload, updated_at: updatedAt });
    } else if (/^\s*DELETE/i.test(sql)) {
      this.rows.delete(params[0] as string);
    }
    return { changes: 1, lastInsertRowId: 0 };
  }

  async getAllAsync(sql: string, ...params: unknown[]): Promise<Row[]> {
    this.getAllCalls.push({ sql, params });
    return [...this.rows.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async getFirstAsync(sql: string, ...params: unknown[]): Promise<Row | null> {
    this.getFirstCalls.push({ sql, params });
    return this.rows.get(params[0] as string) ?? null;
  }
}

describe('SQLiteAlarmRepository', () => {
  let database: FakeSQLiteDatabase;
  let repository: SQLiteAlarmRepository;

  beforeEach(() => {
    database = new FakeSQLiteDatabase();
    repository = new SQLiteAlarmRepository(database);
  });

  it('creates the alarms table and initialization is idempotent', async () => {
    await repository.initialize();
    await repository.initialize();

    expect(database.execCalls).toHaveLength(2);
    expect(database.execCalls[0]).toMatch(/CREATE TABLE IF NOT EXISTS alarms\s*\(/i);
    expect(database.execCalls[0]).toMatch(/id TEXT PRIMARY KEY NOT NULL/i);
    expect(database.execCalls[0]).toMatch(/payload TEXT NOT NULL/i);
    expect(database.execCalls[0]).toMatch(/updated_at TEXT NOT NULL/i);
  });

  it('uses an UPSERT and round-trips complete Alarm JSON', async () => {
    await repository.save(morningAlarm);

    expect(database.runCalls).toHaveLength(1);
    expect(database.runCalls[0].sql).toMatch(/INSERT INTO alarms/i);
    expect(database.runCalls[0].sql).toMatch(/ON CONFLICT\s*\(id\)\s*DO UPDATE/i);
    expect(database.runCalls[0].params).toEqual([
      morningAlarm.id,
      JSON.stringify(morningAlarm),
      morningAlarm.updatedAt,
    ]);
    await expect(repository.get(morningAlarm.id)).resolves.toEqual(morningAlarm);
  });

  it('lists decoded alarms with explicit newest-first SQL ordering', async () => {
    const later = { ...morningAlarm, id: 'later', updatedAt: '2026-07-02T00:00:00.000Z' };
    await repository.save(morningAlarm);
    await repository.save(later);

    await expect(repository.list()).resolves.toEqual([later, morningAlarm]);
    expect(database.getAllCalls[0]).toEqual({
      sql: expect.stringMatching(/ORDER BY updated_at DESC/i),
      params: [],
    });
  });

  it('parameterizes get and delete', async () => {
    await repository.get("id' OR 1=1 --");
    await repository.remove("id' OR 1=1 --");

    expect(database.getFirstCalls[0]).toEqual({
      sql: expect.stringMatching(/WHERE id = \?/i),
      params: ["id' OR 1=1 --"],
    });
    expect(database.runCalls[0]).toEqual({
      sql: expect.stringMatching(/DELETE FROM alarms WHERE id = \?/i),
      params: ["id' OR 1=1 --"],
    });
  });

  it.each([
    ['broken JSON', '{'],
    ['invalid alarm structure', JSON.stringify({ ...morningAlarm, hour: 99 })],
  ])('throws a stable error for %s', async (_description, payload) => {
    database.rows.set(morningAlarm.id, {
      id: morningAlarm.id,
      payload,
      updated_at: morningAlarm.updatedAt,
    });

    await expect(repository.get(morningAlarm.id)).rejects.toThrow(
      `alarm_payload_invalid:${morningAlarm.id}`,
    );
    await expect(repository.list()).rejects.toThrow(`alarm_payload_invalid:${morningAlarm.id}`);
  });
});
