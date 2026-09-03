const fs = require('fs');
const content = fs.readFileSync('src/components/LevelScreen.tsx', 'utf8');

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.startsWith('function drawTiger(ctx: CanvasRenderingContext2D, r: number) {'));

if (startIdx !== -1) {
  const newContent = lines.slice(0, startIdx).join('\n') + '\n' + `function drawTiger(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  
  const tigerOrange = '#ea580c';
  const tigerWhite = '#fef3c7'; // Cream color for underbelly/muzzle
  const tigerBlack = '#171717';
  
  // --- Tail ---
  ctx.strokeStyle = tigerOrange;
  ctx.lineWidth = r * 0.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.quadraticCurveTo(r * 0.6, r * 1.1, r * 0.3, r * 1.5);
  ctx.stroke();
  
  // Tail tip (black)
  ctx.strokeStyle = tigerBlack;
  ctx.beginPath();
  ctx.moveTo(r * 0.35, r * 1.35);
  ctx.quadraticCurveTo(r * 0.3, r * 1.5, r * 0.28, r * 1.5);
  ctx.stroke();
  
  // --- Legs & Paws ---
  ctx.fillStyle = tigerOrange;
  const drawPaw = (x: number, y: number, isFront: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    if (isFront) {
      ctx.rotate(x > 0 ? -Math.PI/12 : Math.PI/12);
    } else {
      ctx.rotate(x > 0 ? Math.PI/12 : -Math.PI/12);
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.15, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = tigerBlack;
    ctx.lineWidth = r * 0.02;
    ctx.beginPath();
    ctx.moveTo(-r * 0.05, -r * 0.25); ctx.lineTo(-r * 0.05, -r * 0.1);
    ctx.moveTo(r * 0.05, -r * 0.25); ctx.lineTo(r * 0.05, -r * 0.1);
    ctx.stroke();
    ctx.restore();
  };
  
  // Pushed out to the sides to be clearly visible
  drawPaw(-r * 0.55, -r * 0.2, true);
  drawPaw(r * 0.55, -r * 0.2, true);
  drawPaw(-r * 0.55, r * 0.6, false);
  drawPaw(r * 0.55, r * 0.6, false);

  // --- Body ---
  ctx.fillStyle = tigerOrange;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-r * 0.4, -r * 0.4, r * 0.8, r * 1.2, r * 0.4);
  } else {
    ctx.rect(-r * 0.4, -r * 0.4, r * 0.8, r * 1.2);
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
  drawTriStripe(-r * 0.1, r * 0.3, 1);
  drawTriStripe(-r * 0.1, r * 0.3, -1);
  drawTriStripe(r * 0.2, r * 0.4, 1);
  drawTriStripe(r * 0.2, r * 0.4, -1);
  drawTriStripe(r * 0.5, r * 0.3, 1);
  drawTriStripe(r * 0.5, r * 0.3, -1);

  // --- Head & Face ---
  const headY = -r * 0.6;
  
  // Ears
  ctx.fillStyle = tigerOrange;
  ctx.beginPath();
  ctx.arc(-r * 0.3, headY + r * 0.2, r * 0.2, 0, Math.PI * 2);
  ctx.arc(r * 0.3, headY + r * 0.2, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner Ears
  ctx.fillStyle = tigerWhite;
  ctx.beginPath();
  ctx.arc(-r * 0.3, headY + r * 0.2, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.3, headY + r * 0.2, r * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Head Base
  ctx.fillStyle = tigerOrange;
  ctx.beginPath();
  ctx.arc(0, headY, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Head Stripes
  ctx.fillStyle = tigerBlack;
  ctx.beginPath();
  ctx.moveTo(0, headY + r * 0.45);
  ctx.lineTo(-r * 0.1, headY + r * 0.15);
  ctx.lineTo(r * 0.1, headY + r * 0.15);
  ctx.fill();

  // Eyes (Placed ABOVE the snout locally)
  const eyeY = headY - r * 0.05;
  ctx.fillStyle = '#fbbf24'; // Yellow eyes
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, eyeY, r * 0.08, r * 0.05, Math.PI/8, 0, Math.PI * 2);
  ctx.ellipse(r * 0.2, eyeY, r * 0.08, r * 0.05, -Math.PI/8, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils
  ctx.fillStyle = tigerBlack;
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, eyeY, r * 0.02, r * 0.05, Math.PI/8, 0, Math.PI * 2);
  ctx.ellipse(r * 0.2, eyeY, r * 0.02, r * 0.05, -Math.PI/8, 0, Math.PI * 2);
  ctx.fill();
  
  // Angry eyebrows
  ctx.strokeStyle = tigerBlack;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, eyeY + r * 0.1);
  ctx.lineTo(-r * 0.1, eyeY + r * 0.05);
  ctx.moveTo(r * 0.3, eyeY + r * 0.1);
  ctx.lineTo(r * 0.1, eyeY + r * 0.05);
  ctx.stroke();

  // Snout/Muzzle (Placed BELOW the eyes locally)
  const snoutY = headY - r * 0.25;
  ctx.fillStyle = tigerWhite;
  ctx.beginPath();
  ctx.ellipse(0, snoutY, r * 0.25, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose (Placed at the very bottom locally)
  const noseTop = snoutY + r * 0.05;
  const noseTip = snoutY - r * 0.05;
  ctx.fillStyle = tigerBlack;
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, noseTop);
  ctx.lineTo(r * 0.1, noseTop);
  ctx.lineTo(0, noseTip);
  ctx.fill();
  
  // Mouth line
  ctx.strokeStyle = tigerBlack;
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.moveTo(0, noseTip);
  ctx.lineTo(0, noseTip - r * 0.05);
  ctx.quadraticCurveTo(-r * 0.1, noseTip - r * 0.1, -r * 0.15, noseTip);
  ctx.moveTo(0, noseTip - r * 0.05);
  ctx.quadraticCurveTo(r * 0.1, noseTip - r * 0.1, r * 0.15, noseTip);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, snoutY); ctx.lineTo(-r * 0.5, snoutY - r * 0.05);
  ctx.moveTo(-r * 0.2, snoutY + r * 0.05); ctx.lineTo(-r * 0.5, snoutY + r * 0.05);
  ctx.moveTo(r * 0.2, snoutY); ctx.lineTo(r * 0.5, snoutY - r * 0.05);
  ctx.moveTo(r * 0.2, snoutY + r * 0.05); ctx.lineTo(r * 0.5, snoutY + r * 0.05);
  ctx.stroke();

  ctx.restore();
}
`;
  fs.writeFileSync('src/components/LevelScreen.tsx', newContent);
  console.log('Fixed tiger successfully');
} else {
  console.log('Could not find drawTiger start');
}
