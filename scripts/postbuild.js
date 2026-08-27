#!/usr/bin/env node
/**
 * Post-build: replace Expo's auto-generated dist/index.html with our
 * custom single-page HTML portfolio. Copy CSS/JS assets to dist/.
 *
 * Run after: `npx expo export --platform all`
 */
const fs = require('fs');
const path = require('path');

const root      = path.resolve(__dirname, '..');
const dist      = path.join(root, 'dist');
const publicDir = path.join(root, 'public');

if (!fs.existsSync(dist)) {
  console.error('❌ dist/ not found. Run `npx expo export --platform all` first.');
  process.exit(1);
}

const copyRecursive = (src, dst) => {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
};

console.log('🔧 postbuild: overlaying custom HTML portfolio onto dist/');

// 1. Replace the auto-generated index.html
const customIndex = path.join(publicDir, 'index.html');
if (fs.existsSync(customIndex)) {
  fs.copyFileSync(customIndex, path.join(dist, 'index.html'));
  console.log('  ✓ index.html (custom HTML)');
} else {
  console.warn('  ⚠ public/index.html not found, keeping Expo default');
}

// 2. Copy CSS + JS folders into dist/
['css', 'js', 'assets'].forEach(folder => {
  const src = path.join(publicDir, folder);
  const dst = path.join(dist, folder);
  copyRecursive(src, dst);
  console.log(`  ✓ ${folder}/`);
});

// 3. Update the title and metadata in metadata.json if present
const metadataPath = path.join(dist, 'metadata.json');
if (fs.existsSync(metadataPath)) {
  try {
    const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    // Keep Expo's metadata for store/CDN purposes
    fs.writeFileSync(metadataPath, JSON.stringify(meta, null, 2));
  } catch (_) {}
}

console.log('✅ postbuild done. Custom HTML portfolio ready in dist/');
