import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceDirectory = path.join(root, 'public', 'images');
const outputDirectory = path.join(sourceDirectory, 'home');
const images = [
  'panel300w_mini',
  'panel1500w_pro',
  'bed_luxor',
  'mask_silicone',
  'torch_laser',
  'belt_smart',
];
const widths = [480, 768];

await fs.mkdir(outputDirectory, { recursive: true });

for (const image of images) {
  const source = path.join(sourceDirectory, `${image}.webp`);
  for (const width of widths) {
    const destination = path.join(outputDirectory, `${image}-${width}.webp`);
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(destination);
    console.log(`Generated ${path.relative(root, destination)}`);
  }
}
