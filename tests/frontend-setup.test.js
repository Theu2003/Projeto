/**
 * TDD Tests for Frontend Setup - Electron + React + Vite (T8)
 * These tests verify the Electron/React/Vite/Tailwind frontend infrastructure.
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

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

function readJson(relativePath) {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
  return JSON.parse(content);
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

// ─── Electron Main Process ─────────────────────────────────────────

test('electron/main.ts exists', () => {
  assert(fileExists('electron/main.ts'), 'electron/main.ts file exists');
});

test('electron/main.ts creates BrowserWindow', () => {
  const content = readFile('electron/main.ts');
  assert(content.includes('BrowserWindow'), 'main.ts references BrowserWindow');
  assert(content.includes('createWindow') || content.includes('mainWindow'), 'main.ts has window creation function');
});

test('electron/main.ts loads renderer URL or file', () => {
  const content = readFile('electron/main.ts');
  assert(
    content.includes('loadURL') || content.includes('loadFile'),
    'main.ts loads a URL or file into the window'
  );
});

// ─── Electron Preload ─────────────────────────────────────────────

test('electron/preload.ts exists', () => {
  assert(fileExists('electron/preload.ts'), 'electron/preload.ts file exists');
});

test('electron/preload.ts uses contextBridge', () => {
  const content = readFile('electron/preload.ts');
  assert(content.includes('contextBridge'), 'preload.ts uses contextBridge');
  assert(content.includes('exposeInMainWorld'), 'preload.ts exposes API to main world');
});

// ─── Electron Vite Config ─────────────────────────────────────────

test('electron/electron.vite.config.ts exists', () => {
  assert(fileExists('electron/electron.vite.config.ts'), 'electron/electron.vite.config.ts exists');
});

test('electron/electron.vite.config.ts has correct structure', () => {
  const content = readFile('electron/electron.vite.config.ts');
  assert(content.includes('defineConfig') || content.includes('vite'), 'config uses defineConfig or vite');
  assert(content.includes('main') || content.includes('preload') || content.includes('renderer'), 'config defines build targets');
});

// ─── React Entry Point ────────────────────────────────────────────

test('src/main.tsx exists', () => {
  assert(fileExists('src/main.tsx'), 'src/main.tsx exists');
});

test('src/main.tsx renders React app', () => {
  const content = readFile('src/main.tsx');
  assert(content.includes('React') || content.includes('react'), 'main.tsx imports React');
  assert(
    content.includes('createRoot') || content.includes('ReactDOM.render') || content.includes('render'),
    'main.tsx renders the app'
  );
});

// ─── App Component ────────────────────────────────────────────────

test('src/App.tsx exists', () => {
  assert(fileExists('src/App.tsx'), 'src/App.tsx exists');
});

test('src/App.tsx exports a React component', () => {
  const content = readFile('src/App.tsx');
  assert(content.includes('export') && (content.includes('function') || content.includes('const')), 'App.tsx exports a component');
  assert(content.includes('App'), 'App.tsx contains App component');
});

test('src/App.tsx has dark mode toggle', () => {
  const content = readFile('src/App.tsx');
  assert(
    content.toLowerCase().includes('dark') && (content.toLowerCase().includes('toggle') || content.toLowerCase().includes('theme')),
    'App.tsx has dark mode toggle or theme switching'
  );
});

// ─── HTML Entry ───────────────────────────────────────────────────

test('src/index.html exists', () => {
  assert(fileExists('src/index.html'), 'src/index.html exists');
});

test('src/index.html has proper structure', () => {
  const content = readFile('src/index.html');
  assert(content.includes('<!DOCTYPE html>') || content.includes('<!doctype html>'), 'index.html has doctype');
  assert(content.includes('<div id="root"') || content.includes('<div id="app"'), 'index.html has root div');
  assert(
    content.includes('src/main.tsx') || content.includes('src/main.ts') ||
    content.includes('/main.tsx') || content.includes('/main.ts') ||
    content.includes('main.tsx'),
    'index.html references main entry'
  );
});

// ─── TypeScript Declaration ───────────────────────────────────────

test('src/vite-env.d.ts exists', () => {
  assert(fileExists('src/vite-env.d.ts'), 'src/vite-env.d.ts exists');
});

test('src/vite-env.d.ts references Vite client types', () => {
  const content = readFile('src/vite-env.d.ts');
  assert(
    content.includes('vite/client') || content.includes('Vite'),
    'vite-env.d.ts references Vite client types'
  );
});

// ─── Tailwind Configuration ───────────────────────────────────────

test('tailwind.config.js exists', () => {
  assert(fileExists('tailwind.config.js'), 'tailwind.config.js exists');
});

test('tailwind.config.js has content configuration', () => {
  const content = readFile('tailwind.config.js');
  assert(content.includes('content') || content.includes('purge'), 'tailwind config has content/purge');
  assert(
    content.includes('src/**') || content.includes('./src'),
    'tailwind config scans src directory'
  );
});

test('tailwind.config.js has dark mode configuration', () => {
  const content = readFile('tailwind.config.js');
  assert(
    content.includes('darkMode'),
    'tailwind config has darkMode setting'
  );
});

// ─── CSS Entry ────────────────────────────────────────────────────

test('src/index.css exists', () => {
  assert(fileExists('src/index.css'), 'src/index.css exists');
});

test('src/index.css includes Tailwind directives', () => {
  const content = readFile('src/index.css');
  assert(
    content.includes('@tailwind') || content.includes('tailwindcss'),
    'index.css includes Tailwind directives'
  );
  assert(content.includes('@tailwind base') || content.includes('@import'), 'index.css has base import');
  assert(content.includes('@tailwind components') || content.includes('components'), 'index.css has components');
  assert(content.includes('@tailwind utilities') || content.includes('utilities'), 'index.css has utilities');
});

// ─── Root package.json Updated ────────────────────────────────────

test('root package.json has electron-vite or electron related dependencies', () => {
  const pkg = readJson('package.json');
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasElectronDep = Object.keys(allDeps).some(k =>
    k.includes('electron') || k.includes('vite') || k.includes('react')
  );
  assert(hasElectronDep, 'package.json has electron/vite/react dependencies');
});

test('root package.json has electron-vite dev script', () => {
  const pkg = readJson('package.json');
  assert(pkg.scripts !== undefined, 'scripts exist');
  const hasDevScript = Object.keys(pkg.scripts).some(k =>
    k.includes('dev') || k.includes('electron') || k.includes('vite')
  );
  assert(hasDevScript, 'package.json has dev/electron/vite script');
});

// ─── Theme Support ────────────────────────────────────────────────

test('tailwind.config.js darkMode is class-based', () => {
  const content = readFile('tailwind.config.js');
  assert(
    content.includes("'class'") || content.includes('"class"'),
    'tailwind darkMode is set to "class" for manual toggle'
  );
});

// ─── Summary ──────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log('═'.repeat(50));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
  process.exit(0);
}
