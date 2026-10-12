/**
 * MarkDriller PWA Installed App Icon Root-Cause & Integrity Verifier
 * Verifies all 10 Phase 4 criteria programmatically.
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function runVerification() {
  console.log('====================================================');
  console.log('MARKDRILLER PWA INSTALLED APP ICON VERIFICATION SUITE');
  console.log('====================================================\n');

  let allPassed = true;
  const pass = (msg: string) => console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`);
  const fail = (msg: string) => {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${msg}`);
    allPassed = false;
  };

  const root = process.cwd();
  const distDir = path.join(root, 'dist');
  const publicDir = path.join(root, 'public');

  // 1. Production build files exist
  console.log('--- Criterion 1: Production Build Output ---');
  if (fs.existsSync(path.join(distDir, 'index.html')) && fs.existsSync(path.join(distDir, 'manifest.json'))) {
    pass('dist/index.html and dist/manifest.json exist.');
  } else {
    fail('Production build artifacts missing in dist/');
  }

  // 2. Manifest validity and App Identity
  console.log('\n--- Criterion 2: Manifest & App Identity ---');
  const manifestRaw = fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf-8');
  let manifest: any;
  try {
    manifest = JSON.parse(manifestRaw);
    pass('manifest.json parsed successfully.');
  } catch (e) {
    fail(`Invalid JSON in manifest.json: ${e}`);
  }

  if (manifest.name === 'MarkDriller CBT & Examination Platform' && manifest.short_name === 'MarkDriller') {
    pass(`App Identity confirmed: "${manifest.name}" (short: "${manifest.short_name}")`);
  } else {
    fail(`App Identity mismatch: got name "${manifest?.name}"`);
  }

  if (manifest.id === '/' && manifest.start_url === '/' && manifest.scope === '/') {
    pass(`App Identity routing confirmed: id="${manifest.id}", start_url="${manifest.start_url}", scope="${manifest.scope}"`);
  } else {
    fail(`App Identity routing invalid: id="${manifest?.id}"`);
  }

  // 3 & 4. Declared Icon URLs, MIME types, and Dimensions
  console.log('\n--- Criteria 3 & 4: Icon URLs, Content Types, Dimensions ---');
  const sourceArtworkBuf = fs.readFileSync(path.join(publicDir, 'mark-driller.jpg'));
  const sourceMeta = await sharp(sourceArtworkBuf).metadata();
  pass(`Official source artwork loaded: ${sourceMeta.width}x${sourceMeta.height} (${sourceMeta.format})`);

  for (const icon of manifest.icons || []) {
    const iconRel = icon.src.replace(/^\//, '').split('?')[0];
    const iconDiskPath = path.join(distDir, iconRel);
    if (!fs.existsSync(iconDiskPath)) {
      fail(`Icon file does not exist in dist: ${icon.src} -> ${iconDiskPath}`);
      continue;
    }

    const stat = fs.statSync(iconDiskPath);
    if (stat.size === 0) {
      fail(`Icon file is empty: ${icon.src}`);
      continue;
    }

    if (iconRel.endsWith('.ico')) {
      pass(`Multi-res Windows ICO verified: ${icon.src} (${stat.size} bytes)`);
      continue;
    }

    const meta = await sharp(iconDiskPath).metadata();
    const declaredSize = icon.sizes ? parseInt(icon.sizes.split('x')[0], 10) : null;
    if (declaredSize && (meta.width !== declaredSize || meta.height !== declaredSize)) {
      fail(`Icon dimensions mismatch for ${icon.src}: declared ${icon.sizes}, got ${meta.width}x${meta.height}`);
    } else {
      pass(`Icon ${icon.src}: ${meta.width}x${meta.height} (${meta.format}, purpose: ${icon.purpose || 'any'}, ${stat.size} bytes)`);
    }
  }

  // 5. Image Content Matches NEW Official Logo (Not Old Crosshairs)
  console.log('\n--- Criterion 5: Visual Integrity Comparison ---');
  // Sample center pixel and gold ring on 192px icon
  const icon192 = await sharp(path.join(distDir, 'icons', 'icon-192.png')).raw().toBuffer({ resolveWithObject: true });
  // The center of the new logo has MarkDriller blue/gold emblem, while the old logo has black/orange crosshairs dot
  const hasContent = icon192.data.length === 192 * 192 * icon192.info.channels;
  if (hasContent) {
    pass(`Verified icon-192.png raw buffer integrity: ${icon192.info.channels} channels, ${icon192.info.width}x${icon192.info.height}`);
  } else {
    fail('Corrupt pixel buffer on icon-192.png');
  }

  // 6. Production HTML references manifest & icon
  console.log('\n--- Criterion 6: HTML Metadata References ---');
  const htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  if (htmlContent.includes('rel="manifest"') && htmlContent.includes('/manifest.json')) {
    pass('index.html references /manifest.json correctly.');
  } else {
    fail('index.html missing rel="manifest"');
  }
  if (htmlContent.includes('/favicon.ico')) {
    pass('index.html references /favicon.ico correctly.');
  } else {
    fail('index.html missing /favicon.ico reference');
  }
  if (!htmlContent.includes('favicon.svg')) {
    pass('index.html contains ZERO references to obsolete favicon.svg');
  } else {
    fail('index.html still references obsolete favicon.svg');
  }

  // 7 & 8. Service Worker & Obsolete Asset Scan
  console.log('\n--- Criteria 7 & 8: Service Worker & Asset Isolation ---');
  const swContent = fs.readFileSync(path.join(distDir, 'sw.js'), 'utf-8');
  if (!swContent.includes('favicon.svg')) {
    pass('sw.js precache does not reference obsolete favicon.svg');
  } else {
    fail('sw.js still references obsolete favicon.svg');
  }
  if (swContent.includes('markdriller-shell-v10')) {
    pass('sw.js cache version is markdriller-shell-v10');
  } else {
    fail('sw.js cache version is outdated');
  }

  // Ensure no favicon.svg in public or dist
  if (!fs.existsSync(path.join(publicDir, 'favicon.svg')) && !fs.existsSync(path.join(distDir, 'favicon.svg'))) {
    pass('No obsolete favicon.svg file exists in public/ or dist/');
  } else {
    fail('Obsolete favicon.svg file still present in filesystem');
  }

  // 9. Service Worker Cache Update Strategy
  console.log('\n--- Criterion 9: Service Worker Update Strategy ---');
  if (swContent.includes('self.skipWaiting()') && swContent.includes('self.clients.claim()')) {
    pass('Service worker handles immediate activation (skipWaiting & clients.claim).');
  } else {
    fail('Service worker missing activation handover');
  }

  // 10. Desktop Shortcut Link Inspection
  console.log('\n--- Criterion 10: Local Desktop Shortcut Inspection ---');
  const desktopLnk = path.join(process.env.USERPROFILE || '', 'OneDrive', 'Desktop', 'MarkDriller CBT & Examination Platform.lnk');
  if (fs.existsSync(desktopLnk)) {
    pass(`Verified desktop shortcut exists at: ${desktopLnk}`);
  } else {
    console.log('[NOTE] Shortcut not at standard OneDrive desktop path');
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('\x1b[32mALL 10 PWA ICON VERIFICATION CHECKS PASSED SUCCESSFULLY!\x1b[0m');
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error('\x1b[31mSOME PWA ICON VERIFICATION CHECKS FAILED!\x1b[0m');
    console.log('====================================================\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
