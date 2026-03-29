import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const imagesDir = path.join(rootDir, 'public', 'images');

(async () => {
  console.log('Starting image compression to WebP...');
  const files = fs.readdirSync(imagesDir);
  
  // Convert images
  for (const file of files) {
    if (file.endsWith('.png')) {
      const inputPath = path.join(imagesDir, file);
      const outputPath = path.join(imagesDir, file.replace('.png', '.webp'));
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        console.log(`Converted: ${file} -> ${file.replace('.png', '.webp')}`);
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err);
      }
    }
  }

  // Update HTML references
  const getHtmlFiles = (dir, fileList = []) => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        if (!['dist', 'node_modules', 'scripts', 'src', 'public', '.git'].includes(item) && !item.startsWith('.')) {
          getHtmlFiles(itemPath, fileList);
        }
      } else if (item.endsWith('.html')) {
          fileList.push(itemPath);
      }
    }
    return fileList;
  };

  const htmlFiles = getHtmlFiles(rootDir);
  console.log(`Updating ${htmlFiles.length} HTML files to use WebP...`);

  htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let updated = false;

    // We only replace /images/*.png to /images/*.webp
    files.forEach(img => {
      if (img.endsWith('.png') && img !== 'og-cover.png') { // og-cover usually needs to be jpg/png for broad social support
        const pngPath = `/images/${img}`;
        const webpPath = `/images/${img.replace('.png', '.webp')}`;
        
        if (content.includes(pngPath)) {
          // Replace all occurrences
          content = content.replace(new RegExp(pngPath, 'g'), webpPath);
          updated = true;
        }
      }
    });

    if (updated) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated HTML: ${path.relative(rootDir, file)}`);
    }
  });

  console.log('Optimization complete!');
})();
