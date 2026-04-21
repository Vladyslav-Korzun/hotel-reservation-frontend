const { readFileSync, rmSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = resolve(__dirname, '..');
const specPath = resolve(
  repoRoot,
  '../Academy_Backend-main/application/api-spec/src/main/resources/openapi/hotel-reservation.yaml',
);
const outputPath = resolve(repoRoot, 'src/app/core/api/generated/hotel-reservation.types.ts');
const tempPath = `${outputPath}.tmp`;

const cliPath = resolve(repoRoot, 'node_modules/openapi-typescript/bin/cli.js');

const generation = spawnSync(
  process.execPath,
  [cliPath, specPath, '-o', tempPath],
  { stdio: 'inherit', cwd: repoRoot },
);

if (generation.status !== 0) {
  process.exit(generation.status ?? 1);
}

const current = readFileSync(outputPath);
const generated = readFileSync(tempPath);
rmSync(tempPath, { force: true });

if (!current.equals(generated)) {
  console.error('Generated API types are out of date. Run: npm run generate:api-types');
  process.exit(1);
}

console.log('API types are up to date.');
