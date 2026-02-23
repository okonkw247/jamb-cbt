import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/logo.svg');

sharp(Buffer.from(svg))
  .resize(1200, 630, { fit: 'contain', background: { r: 26, g: 92, b: 42 } })
  .png()
  .toFile('./public/og-image.png')
  .then(() => console.log('OG image created!'))
  .catch(console.error);
