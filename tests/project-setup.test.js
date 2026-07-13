/**
 * TDD Tests for Project Setup & Monorepo Structure (T1)
 * These tests verify that the monorepo is properly configured.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readJson(relativePath) {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
  return JSON.parse(content);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    console.log(`\nTEST: ${name}`);
    fn();
    passed++;
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    failed++;
  }
}

// ─── Root package.json ───────────────────────────────────────────────

test('root package.json exists', () => {
  assert(fileExists('package.json'), 'package.json exists at root');
});

test('root package.json has correct name', () => {
  const pkg = readJson('package.json');
  assert(pkg.name === 'ecocoleta', `name is "ecocoleta", got "${pkg.name}"`);
});

test('root package.json has workspaces configured', () => {
  const pkg = readJson('package.json');
  assert(Array.isArray(pkg.workspaces), 'workspaces is an array');
  assert(
    pkg.workspaces.includes('server'),
    'workspaces includes "server"'
  );
});

test('root package.json has correct scripts', () => {
  const pkg = readJson('package.json');
  assert(pkg.scripts !== undefined, 'scripts section exists');
  assert(typeof pkg.scripts.dev === 'string', 'dev script exists');
  assert(typeof pkg.scripts.build === 'string', 'build script exists');
  assert(typeof pkg.scripts.test === 'string', 'test script exists');
});

test('root package.json has private: true (monorepo convention)', () => {
  const pkg = readJson('package.json');
  assert(pkg.private === true, 'private is true');
});

// ─── Server package.json ─────────────────────────────────────────────

test('server/package.json exists', () => {
  assert(fileExists('server/package.json'), 'server/package.json exists');
});

test('server/package.json has correct name', () => {
  const pkg = readJson('server/package.json');
  assert(pkg.name === '@ecocoleta/server', `name is "@ecocoleta/server", got "${pkg.name}"`);
});

test('server package.json has type: module', () => {
  const pkg = readJson('server/package.json');
  assert(pkg.type === 'module', 'type is "module"');
});

test('server package.json has required dependencies', () => {
  const pkg = readJson('server/package.json');
  const requiredDeps = ['express', 'prisma', '@prisma/client', 'socket.io', 'jsonwebtoken', 'bcryptjs', 'zod', 'cors', 'dotenv'];
  for (const dep of requiredDeps) {
    assert(
      (pkg.dependencies && pkg.dependencies[dep]) || (pkg.devDependencies && pkg.devDependencies[dep]),
      `dependency "${dep}" exists`
    );
  }
});

test('server package.json has required devDependencies', () => {
  const pkg = readJson('server/package.json');
  const requiredDevDeps = ['typescript', '@types/express', '@types/node', '@types/cors', '@types/jsonwebtoken', '@types/bcryptjs', 'tsx', 'vitest'];
  for (const dep of requiredDevDeps) {
    assert(
      pkg.devDependencies && pkg.devDependencies[dep],
      `devDependency "${dep}" exists`
    );
  }
});

test('server package.json has required scripts', () => {
  const pkg = readJson('server/package.json');
  assert(typeof pkg.scripts.dev === 'string', 'dev script exists');
  assert(typeof pkg.scripts.build === 'string', 'build script exists');
  assert(typeof pkg.scripts.start === 'string', 'start script exists');
  assert(typeof pkg.scripts.test === 'string', 'test script exists');
  assert(typeof pkg.scripts['db:generate'] === 'string', 'db:generate script exists');
  assert(typeof pkg.scripts['db:push'] === 'string', 'db:push script exists');
  assert(typeof pkg.scripts['db:seed'] === 'string', 'db:seed script exists');
});

// ─── TypeScript configs ──────────────────────────────────────────────

test('root tsconfig.json exists', () => {
  assert(fileExists('tsconfig.json'), 'tsconfig.json exists at root');
});

test('root tsconfig.json has compiler options', () => {
  const tsconfig = readJson('tsconfig.json');
  assert(tsconfig.compilerOptions !== undefined, 'compilerOptions exists');
  assert(tsconfig.compilerOptions.target !== undefined, 'target is set');
  assert(tsconfig.compilerOptions.module !== undefined, 'module is set');
  assert(tsconfig.compilerOptions.strict === true, 'strict is true');
});

test('server/tsconfig.json exists', () => {
  assert(fileExists('server/tsconfig.json'), 'server/tsconfig.json exists');
});

test('server/tsconfig.json has correct config', () => {
  const tsconfig = readJson('server/tsconfig.json');
  assert(tsconfig.compilerOptions !== undefined, 'compilerOptions exists');
  assert(tsconfig.compilerOptions.outDir !== undefined, 'outDir is set');
  assert(tsconfig.compilerOptions.rootDir !== undefined, 'rootDir is set');
});

// ─── Environment config ──────────────────────────────────────────────

test('.env.example exists', () => {
  assert(fileExists('.env.example'), '.env.example exists');
});

test('.env.example has required variables', () => {
  const env = readFile('.env.example');
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  for (const v of requiredVars) {
    assert(env.includes(v), `.env.example includes ${v}`);
  }
});

// ─── .gitignore ──────────────────────────────────────────────────────

test('.gitignore exists', () => {
  assert(fileExists('.gitignore'), '.gitignore exists');
});

test('.gitignore has essential entries', () => {
  const gitignore = readFile('.gitignore');
  const essential = ['node_modules', '.env', 'dist', '.DS_Store'];
  for (const entry of essential) {
    assert(gitignore.includes(entry), `.gitignore includes "${entry}"`);
  }
});

// ─── README ──────────────────────────────────────────────────────────

test('README.md exists', () => {
  assert(fileExists('README.md'), 'README.md exists');
});

test('README.md has project name and description', () => {
  const readme = readFile('README.md');
  assert(readme.includes('EcoColeta'), 'README mentions "EcoColeta"');
  assert(readme.toLowerCase().includes('recicl') || readme.toLowerCase().includes('recycle') || readme.toLowerCase().includes('coleta'), 'README mentions recycling/collection');
});

// ─── Server source structure ─────────────────────────────────────────

test('server/src directory exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'server/src')), 'server/src directory exists');
});

test('server/src/app.ts exists (Express app)', () => {
  assert(fileExists('server/src/app.ts'), 'server/src/app.ts exists');
});

test('server/src/server.ts exists (HTTP + Socket.IO)', () => {
  assert(fileExists('server/src/server.ts'), 'server/src/server.ts exists');
});

// ─── Summary ─────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log('═'.repeat(50));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll tests passed! ✓');
  process.exit(0);
}
