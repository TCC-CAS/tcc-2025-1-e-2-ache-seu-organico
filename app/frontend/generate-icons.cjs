const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, 'public', 'logo.png');
const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA...');
  
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 237, g: 245, b: 232, alpha: 1 }
        })
        .toFile(outputFile);
      
      console.log(`✅ Criado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erro ao criar icon-${size}x${size}.png:`, error.message);
    }
  }
  
  console.log('✨ Ícones gerados com sucesso!');
}

generateIcons().catch(console.error);
