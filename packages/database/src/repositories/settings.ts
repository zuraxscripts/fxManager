import { eq } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { settings } from '../schema';
import type * as schema from '../schema';

type DB = BunSQLiteDatabase<typeof schema>;

export const EDITABLE_SETTINGS_KEYS = [
	'executable',
	'serverDataPath',
	'serverConfigFile',
	'onesync',
] as const;

class SettingsRepository {
	private static instance: SettingsRepository;

	private constructor(private readonly db: DB) {}

	static getInstance(db: DB): SettingsRepository {
		if (!SettingsRepository.instance) {
			SettingsRepository.instance = new SettingsRepository(db);
		}

		return SettingsRepository.instance;
	}

	get<T = unknown>(key: string): T | undefined {
		const row = this.db
			.select()
			.from(settings)
			.where(eq(settings.key, key))
			.get();
		return row?.value as T | undefined;
	}

	set(key: (typeof EDITABLE_SETTINGS_KEYS)[number], value: unknown) {
		if (!EDITABLE_SETTINGS_KEYS.includes(key)) {
			throw new Error(`The setting "${key}" is not listed as editable.`);
		}

		return this.db
			.insert(settings)
			.values({ key, value, updatedAt: new Date() })
			.onConflictDoUpdate({
				target: settings.key,
				set: { value, updatedAt: new Date() },
			})
			.returning()
			.get();
	}

	all() {
		return this.db.select().from(settings).all();
	}
}

export function createSettingsRepository(db: DB) {
	return SettingsRepository.getInstance(db);
}
