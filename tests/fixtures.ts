import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(HERE, '..', 'reference', 'tests-base');

export function readFixture(name: string): string {
  return readFileSync(join(FIXTURE_DIR, name), 'utf-8');
}
