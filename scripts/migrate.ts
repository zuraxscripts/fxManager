import { join } from 'path';
import drizzleConfig from '../drizzle.config';
import { migrations } from '../packages/database/src/migrations';
import { createInterface } from 'readline/promises';

if (!drizzleConfig.out) {
	throw new Error('Drizzle Config "out" field is not defined.');
}

const migrationDir = join(import.meta.dir, '..', drizzleConfig.out);
const migrationMetaDir = join(migrationDir, 'meta', '_journal.json');
const journalFile = Bun.file(migrationMetaDir);

if (!(await journalFile.exists())) {
	throw new Error(`Journal not found at ${migrationMetaDir}`);
}

interface Journal {
	entries: { tag: string }[];
}

const journal = (await journalFile.json()) as Journal;
const existingVersions = new Set(migrations.map((m) => m.version));

const pendingEntries = journal.entries
	.map(({ tag }) => ({
		tag,
		version: parseInt(tag.substring(0, 4), 10),
	}))
	.filter(({ version }) => !existingVersions.has(version));

if (pendingEntries.length === 0) {
	console.log('Local migrations are up to date.');
	process.exit(0);
}

function sanitizeSql(sql: string): string[] {
	return sql
		.replace(/\/\*[\s\S]*?\*\//g, '') // remove multiline comments
		.replace(/--.*$/gm, '') // remove single line comments
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const targetMigrationDir = join(
	import.meta.dir,
	'..',
	'packages',
	'database',
	'src',
	'migrations',
	'migrations',
);

/**
 * updates the central index.ts acting as migration registry
 */
async function updateMigrationRegistry(varName: string, tag: string) {
	const indexPath = join(targetMigrationDir, 'index.ts');
	let content = await Bun.file(indexPath).text();

	const importLine = `import { ${varName} } from './${tag}';\n`;
	if (!content.includes(importLine)) {
		content = importLine + content;
	}

	const arrayRegex = /(export const migrations: Migration\[\] = \[)(.*)(\];)/s;
	content = content.replace(arrayRegex, (_, start, middle, end) => {
		const currentItems = middle.trim();
		const newItems = currentItems ? `${currentItems}, ${varName}` : varName;
		return `${start}${newItems}${end}`;
	});

	await Bun.write(indexPath, content);
}

for (const { tag, version } of pendingEntries) {
	const rawSql = await Bun.file(join(migrationDir, `${tag}.sql`)).text();
	const queries = sanitizeSql(rawSql);

	console.log(`\nMigration: ${tag}`);
	const description = await rl.question('Description: ');

	const varName = `m${tag}`;
	const payload = { version, description, up: queries };

	const fileContent = [
		"import type { Migration } from '../types';",
		'',
		`export const ${varName}: Migration = ${JSON.stringify(payload, null, 2)};`,
	].join('\n');

	await Bun.write(join(targetMigrationDir, `${tag}.ts`), fileContent);
	await updateMigrationRegistry(varName, tag);

	console.log(`Processed ${tag}`);
}

rl.close();
