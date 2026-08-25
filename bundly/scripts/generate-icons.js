const path = require("path");
const sharp = require("sharp");

const OUT = path.join(__dirname, "..", "assets");

const BRAND_START = "#FF6B9D";
const BRAND_MID = "#FF7AB5";
const BRAND_END = "#FF8E53";

// Two overlapping hearts, viewBox 0 0 24 24, centered around (12, 12).
const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function heartsGroup({ scale, opacityBack = 0.55 }) {
  // Back heart: shifted up-left, translucent. Front heart: shifted down-right, solid.
  return `
    <g transform="translate(512 512) scale(${scale})">
      <g transform="translate(-13.2 -13.2)">
        <path d="${HEART_PATH}" fill="#FFFFFF" opacity="${opacityBack}" />
      </g>
      <g transform="translate(1.2 1.2)">
        <path d="${HEART_PATH}" fill="#FFFFFF" />
      </g>
    </g>
  `;
}

function svgIconFull() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND_START}" />
        <stop offset="55%" stop-color="${BRAND_MID}" />
        <stop offset="100%" stop-color="${BRAND_END}" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" />
    ${heartsGroup({ scale: 16.5 })}
  </svg>`;
}

function svgBackgroundOnly() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND_START}" />
        <stop offset="55%" stop-color="${BRAND_MID}" />
        <stop offset="100%" stop-color="${BRAND_END}" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" />
  </svg>`;
}

function svgForegroundGlyph({ mono } = {}) {
  // Kept within the ~66% safe-zone circle for Android adaptive icons.
  const scale = 11.5;
  if (!mono) {
    return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      ${heartsGroup({ scale })}
    </svg>`;
  }
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(512 512) scale(${scale})">
      <g transform="translate(-13.2 -13.2)"><path d="${HEART_PATH}" fill="#FFFFFF" opacity="0.55" /></g>
      <g transform="translate(1.2 1.2)"><path d="${HEART_PATH}" fill="#FFFFFF" /></g>
    </g>
  </svg>`;
}

function svgGlyphOnly({ size = 1024, scale = 15 } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    ${heartsGroup({ scale })}
  </svg>`;
}

// The app icon (gradient tile + hearts) with rounded corners baked in, on a
// transparent canvas — used for splash screens and in-app loading states,
// where nothing else applies an OS icon mask for us. Matches what people
// actually see as the "Bundly icon" on their home screen, instead of the
// bare white glyph the splash used before.
function svgRoundedTile() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND_START}" />
        <stop offset="55%" stop-color="${BRAND_MID}" />
        <stop offset="100%" stop-color="${BRAND_END}" />
      </linearGradient>
      <clipPath id="tile">
        <rect width="1024" height="1024" rx="224" ry="224" />
      </clipPath>
    </defs>
    <g clip-path="url(#tile)">
      <rect width="1024" height="1024" fill="url(#bg)" />
      ${heartsGroup({ scale: 16.5 })}
    </g>
  </svg>`;
}

async function render(svg, outFile, { width, height } = {}) {
  let img = sharp(Buffer.from(svg));
  if (width && height) img = img.resize(width, height);
  await img.png().toFile(outFile);
  console.log("wrote", outFile);
}

async function main() {
  await render(svgIconFull(), path.join(OUT, "icon.png"));
  await render(svgBackgroundOnly(), path.join(OUT, "android-icon-background.png"));
  await render(svgForegroundGlyph(), path.join(OUT, "android-icon-foreground.png"));
  await render(svgForegroundGlyph({ mono: true }), path.join(OUT, "android-icon-monochrome.png"));
  await render(svgIconFull(), path.join(OUT, "favicon.png"), { width: 196, height: 196 });
  await render(svgRoundedTile(), path.join(OUT, "splash-icon.png"), { width: 512, height: 512 });
  await render(svgGlyphOnly({ scale: 15 }), path.join(OUT, "notification-icon.png"), {
    width: 256,
    height: 256,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
