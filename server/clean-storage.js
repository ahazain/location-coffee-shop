const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, 'storage', 'geotiff', 'raw'),
  path.join(__dirname, 'storage', 'geotiff', 'fuzzy'),
  path.join(__dirname, 'storage', 'geotiff', 'final_score'),
  path.join(__dirname, 'uploads', 'geojson'),
];

console.log('=== Cleaning local GeoTIFF and GeoJSON storage ===');

targets.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`Cleaning files in: ${dir}`);
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          console.log(`  Deleted file: ${file}`);
        } else if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`  Deleted folder: ${file}`);
        }
      } catch (err) {
        console.error(`  Failed to delete ${file}:`, err.message);
      }
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('Storage cleaning completed successfully.');
