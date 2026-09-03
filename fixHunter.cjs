const fs = require('fs');
const content = fs.readFileSync('src/components/LevelScreen.tsx', 'utf8');

const regex = /function drawHunter\(ctx: CanvasRenderingContext2D, r: number\) \{[\s\S]*?\}\n\nfunction drawTreasureChest/m;

const replacement = `function drawHunter(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  
  const skin = '#fcd34d'; // Skin tone
  const shirt = '#4d7c0f'; // Jungle green
  const pants = '#92400e'; // Brown pants
  const boots = '#451a03'; // Dark brown boots
  const backpack = '#78350f'; // Leather backpack
  const hat = '#b45309'; // Fedora brown
  const hatBand = '#171717'; // Black hat band

  // --- Legs (Back/Bottom, facing positive Y) ---
  // Left leg
  ctx.fillStyle = pants;
  ctx.fillRect(-r * 0.3, r * 0.3, r * 0.25, r * 0.5);
  // Right leg
  ctx.fillRect(r * 0.05, r * 0.3, r * 0.25, r * 0.5);
  
  // Boots
  ctx.fillStyle = boots;
  ctx.beginPath();
  if (ctx.roundRect) {
      ctx.roundRect(-r * 0.35, r * 0.7, r * 0.35, r * 0.35, r * 0.1);
      ctx.roundRect(r * 0.0, r * 0.7, r * 0.35, r * 0.35, r * 0.1);
  } else {
      ctx.fillRect(-r * 0.35, r * 0.7, r * 0.35, r * 0.35);
      ctx.fillRect(r * 0.0, r * 0.7, r * 0.35, r * 0.35);
  }
  ctx.fill();

  // --- Backpack (Behind the body) ---
  ctx.fillStyle = backpack;
  ctx.beginPath();
  if (ctx.roundRect) {
     ctx.roundRect(-r * 0.45, r * 0.1, r * 0.9, r * 0.5, r * 0.15);
  } else {
     ctx.fillRect(-r * 0.45, r * 0.1, r * 0.9, r * 0.5);
  }
  ctx.fill();
  
  // Sleeping bag / blanket roll on backpack
  ctx.fillStyle = '#14532d'; // Dark green roll
  ctx.beginPath();
  ctx.ellipse(0, r * 0.55, r * 0.45, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Blanket straps
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-r * 0.25, r * 0.4, r * 0.08, r * 0.3);
  ctx.fillRect(r * 0.17, r * 0.4, r * 0.08, r * 0.3);

  // --- Body (Shirt) ---
  ctx.fillStyle = shirt;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-r * 0.4, -r * 0.3, r * 0.8, r * 0.6, r * 0.2);
  } else {
    ctx.fillRect(-r * 0.4, -r * 0.3, r * 0.8, r * 0.6);
  }
  ctx.fill();
  
  // Belt
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-r * 0.4, r * 0.2, r * 0.8, r * 0.12);
  // Belt buckle
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-r * 0.12, r * 0.18, r * 0.24, r * 0.16);

  // Backpack Straps on shoulders
  ctx.strokeStyle = backpack;
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, -r * 0.2);
  ctx.lineTo(-r * 0.25, r * 0.2);
  ctx.moveTo(r * 0.25, -r * 0.2);
  ctx.lineTo(r * 0.25, r * 0.2);
  ctx.stroke();

  // --- Arms & Hands ---
  // Left Arm
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(-r * 0.45, -r * 0.1, r * 0.15, r * 0.3, -Math.PI/8, 0, Math.PI * 2);
  ctx.fill();
  // Right Arm
  ctx.beginPath();
  ctx.ellipse(r * 0.45, -r * 0.1, r * 0.15, r * 0.3, Math.PI/8, 0, Math.PI * 2);
  ctx.fill();
  
  // Hands (reaching forward a bit, so smaller Y)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(-r * 0.55, -r * 0.35, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.55, -r * 0.35, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // --- Head & Hat ---
  // Since looking up (facing -Y), the nose points up
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#d97706'; // darker skin for nose
  ctx.beginPath();
  ctx.arc(0, -r * 0.5, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Fedora Brim
  ctx.fillStyle = hat;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.15, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Fedora Top
  ctx.fillStyle = '#92400e'; // slightly darker for depth
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.1, r * 0.35, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hat Band
  ctx.strokeStyle = hatBand;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  // Draw curve for band (front half)
  ctx.ellipse(0, -r * 0.1, r * 0.35, r * 0.3, 0, Math.PI, 0);
  ctx.stroke();

  ctx.restore();
}

function drawTreasureChest`;

const updatedContent = content.replace(regex, replacement);
fs.writeFileSync('src/components/LevelScreen.tsx', updatedContent);
console.log('Hunter updated!');
