const fs = require('fs');
const content = fs.readFileSync('src/components/LevelScreen.tsx', 'utf8');

const regex = /function drawTiger\(ctx: CanvasRenderingContext2D, r: number\) \{[\s\S]*?\}\n/m;

const replacement = `function drawTiger(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  
  const tigerOrange = '#ea580c';
  const tigerWhite = '#fef3c7'; // Cream color for underbelly/muzzle
  const tigerBlack = '#171717';
  
  // Tail
  ctx.strokeStyle = tigerOrange;
  ctx.lineWidth = r * 0.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.quadraticCurveTo(r * 0.6, r * 1.2, r * 0.4, r * 1.5);
  ctx.stroke();
  
  // Tail tip (black)
  ctx.strokeStyle = tigerBlack;
  ctx.beginPath();
  ctx.moveTo(r * 0.45, r * 1.4);
  ctx.quadraticCurveTo(r * 0.4, r * 1.5, r * 0.35, r * 1.5);
  ctx.stroke();
  
  // Paws
  ctx.fillStyle = tigerOrange;
  // front left
  ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.4, r * 0.15, r * 0.25, -Math.PI/6, 0, Math.PI * 2); ctx.fill();
  // front right
  ctx.beginPath(); ctx.ellipse(r * 0.4, -r * 0.4, r * 0.15, r * 0.25, Math.PI/6, 0, Math.PI * 2); ctx.fill();
  // back left
  ctx.beginPath(); ctx.ellipse(-r * 0.4, r * 0.6, r * 0.15, r * 0.25, Math.PI/6, 0, Math.PI * 2); ctx.fill();
  // back right
  ctx.beginPath(); ctx.ellipse(r * 0.4, r * 0.6, r * 0.15, r * 0.25, -Math.PI/6, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = tigerOrange;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-r * 0.4, -r * 0.6, r * 0.8, r * 1.4, r * 0.4);
  } else {
    ctx.rect(-r * 0.4, -r * 0.6, r * 0.8, r * 1.4);
  }
  ctx.fill();

  // Body Stripes
  ctx.fillStyle = tigerBlack;
  const drawTriStripe = (y: number, w: number, dir: number) => {
    ctx.beginPath();
    ctx.moveTo(dir * r * 0.4, y);
    ctx.lineTo(dir * (r * 0.4 - w), y + r * 0.05);
    ctx.lineTo(dir * r * 0.4, y + r * 0.1);
    ctx.fill();
  };
  drawTriStripe(r * 0.0, r * 0.3, 1);
  drawTriStripe(r * 0.0, r * 0.3, -1);
  drawTriStripe(r * 0.25, r * 0.4, 1);
  drawTriStripe(r * 0.25, r * 0.4, -1);
  drawTriStripe(r * 0.5, r * 0.3, 1);
  drawTriStripe(r * 0.5, r * 0.3, -1);

  // Ears
  ctx.fillStyle = tigerOrange;
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.75, r * 0.2, 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.75, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner Ears
  ctx.fillStyle = tigerWhite;
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.75, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.75, r * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = tigerOrange;
  ctx.beginPath();
  ctx.arc(0, -r * 0.5, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Snout/Muzzle
  ctx.fillStyle = tigerWhite;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.35, r * 0.25, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = tigerBlack;
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.4);
  ctx.lineTo(r * 0.1, -r * 0.4);
  ctx.lineTo(0, -r * 0.3);
  ctx.fill();

  // Head Stripes
  ctx.fillStyle = tigerBlack;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.95);
  ctx.lineTo(-r * 0.1, -r * 0.7);
  ctx.lineTo(r * 0.1, -r * 0.7);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.35); ctx.lineTo(-r * 0.5, -r * 0.4);
  ctx.moveTo(-r * 0.2, -r * 0.32); ctx.lineTo(-r * 0.5, -r * 0.32);
  ctx.moveTo(r * 0.2, -r * 0.35); ctx.lineTo(r * 0.5, -r * 0.4);
  ctx.moveTo(r * 0.2, -r * 0.32); ctx.lineTo(r * 0.5, -r * 0.32);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#fbbf24'; // Yellow eyes
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, -r * 0.55, r * 0.08, r * 0.05, Math.PI/8, 0, Math.PI * 2);
  ctx.ellipse(r * 0.2, -r * 0.55, r * 0.08, r * 0.05, -Math.PI/8, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils (slits)
  ctx.fillStyle = tigerBlack;
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, -r * 0.55, r * 0.02, r * 0.05, Math.PI/8, 0, Math.PI * 2);
  ctx.ellipse(r * 0.2, -r * 0.55, r * 0.02, r * 0.05, -Math.PI/8, 0, Math.PI * 2);
  ctx.fill();
  
  // Angry eyebrows
  ctx.strokeStyle = tigerBlack;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.65);
  ctx.lineTo(-r * 0.1, -r * 0.6);
  ctx.moveTo(r * 0.3, -r * 0.65);
  ctx.lineTo(r * 0.1, -r * 0.6);
  ctx.stroke();

  ctx.restore();
}
`;

const updatedContent = content.replace(regex, replacement);
fs.writeFileSync('src/components/LevelScreen.tsx', updatedContent);
console.log('Tiger updated!');
