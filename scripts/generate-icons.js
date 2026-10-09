import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 1. Define high-resolution SVG artwork with Musical Note + "ITS Music" text below
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090414"/>
      <stop offset="50%" stop-color="#1b0a33"/>
      <stop offset="100%" stop-color="#340848"/>
    </linearGradient>

    <!-- Musical Note Gradient -->
    <linearGradient id="noteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff2a85"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>

    <!-- Text Gradient -->
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Glow Effect -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>

  <!-- Outer Neon Atmosphere Ring -->
  <circle cx="256" cy="256" r="220" fill="none" stroke="url(#noteGrad)" stroke-width="6" opacity="0.4" filter="url(#glow)"/>

  <!-- Glowing musical note group -->
  <g filter="url(#glow)" opacity="0.95">
    <!-- Left Note Head -->
    <ellipse cx="170" cy="285" rx="38" ry="28" transform="rotate(-22 170 285)" fill="url(#noteGrad)"/>
    <!-- Right Note Head -->
    <ellipse cx="310" cy="245" rx="38" ry="28" transform="rotate(-22 310 245)" fill="url(#noteGrad)"/>
    
    <!-- Left Stem -->
    <rect x="194" y="105" width="18" height="170" rx="9" fill="url(#noteGrad)"/>
    <!-- Right Stem -->
    <rect x="334" y="65" width="18" height="170" rx="9" fill="url(#noteGrad)"/>
    
    <!-- Top Connecting Beam -->
    <polygon points="194,105 352,65 352,110 194,150" fill="url(#noteGrad)"/>
  </g>

  <!-- Sharp crisp note overlay for maximum clarity -->
  <g>
    <ellipse cx="170" cy="285" rx="36" ry="26" transform="rotate(-22 170 285)" fill="url(#noteGrad)"/>
    <ellipse cx="310" cy="245" rx="36" ry="26" transform="rotate(-22 310 245)" fill="url(#noteGrad)"/>
    <rect x="195" y="105" width="16" height="170" rx="8" fill="url(#noteGrad)"/>
    <rect x="335" y="65" width="16" height="170" rx="8" fill="url(#noteGrad)"/>
    <polygon points="195,105 351,65 351,108 195,148" fill="url(#noteGrad)"/>
  </g>

  <!-- Sparkle dots -->
  <circle cx="120" cy="140" r="8" fill="#ff2a85" filter="url(#softGlow)"/>
  <circle cx="390" cy="160" r="10" fill="#38bdf8" filter="url(#softGlow)"/>
  <circle cx="360" cy="300" r="6" fill="#a855f7" filter="url(#softGlow)"/>

  <!-- "ITS Music" Text Below -->
  <!-- Glow layer for text -->
  <text x="256" y="430" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="54" letter-spacing="3" fill="#ec4899" filter="url(#softGlow)">ITS Music</text>
  <!-- Sharp text overlay -->
  <text x="256" y="430" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="54" letter-spacing="3" fill="url(#textGrad)">ITS Music</text>
</svg>`;

// Safe-zone padded version for Android Maskable Icon (15% padding = 512 total size)
const maskableSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#090414"/>
  <g transform="translate(61, 61) scale(0.76)">
    ${svgContent.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">', '').replace('</svg>', '')}
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write SVGs
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf-8');

  // Convert SVG to PNGs
  const svgBuffer = Buffer.from(svgContent);
  const maskableBuffer = Buffer.from(maskableSvgContent);

  // 1. apple-touch-icon.png (180x180) for iOS Safari Add to Home Screen
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 2. pwa-192x192.png (192x192) for Android / Chrome PWA
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 3. pwa-512x512.png (512x512) for Android Splash & Web
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 4. pwa-maskable-512x512.png (512x512) for Android Adaptive Icon
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 5. favicon.png (64x64) for Browser Favicon
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Successfully generated new Musical Note ITS Music icons & favicons!');
}

generate().catch(console.error);
