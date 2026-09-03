import React, { useEffect, useRef, useState } from 'react';
import { playDing, playBoing, startMusic, stopMusic, pauseMusic, resumeMusic } from '../lib/audio';

type LevelProps = {
  level: number;
  onComplete: () => void;
  onQuit: () => void;
};

type Entity = {
  id: number;
  type: 'collect' | 'avoid';
  x: number;
  y: number;
  radius: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
};

export default function LevelScreen({ level, onComplete, onQuit }: LevelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const targetScore = 15;
  
  // Mutable game state
  const state = useRef({
    playerX: -1,
    targetPlayerX: -1,
    keys: { left: false, right: false },
    entities: [] as Entity[],
    nextSpawn: 0,
    freezeTimer: 0,
    score: 0,
    time: 0,
    isPaused: false,
    particles: [] as {x: number, y: number, vx: number, vy: number, life: number, color: string}[],
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused(prev => {
          const next = !prev;
          state.current.isPaused = next;
          if (next) pauseMusic();
          else resumeMusic();
          return next;
        });
      }
      if (e.key === 'ArrowLeft') state.current.keys.left = true;
      if (e.key === 'ArrowRight') state.current.keys.right = true;
      if (e.key === 'n' || e.key === 'N') {
        state.current.score = targetScore;
        setScore(targetScore);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') state.current.keys.left = false;
      if (e.key === 'ArrowRight') state.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    startMusic(level);
    return () => stopMusic();
  }, [level]);

  useEffect(() => {
    state.current.score = 0;
    state.current.entities = [];
    setScore(0);
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const loop = (time: number) => {
      if (state.current.isPaused) {
        lastTime = time;
      }
      
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!state.current.isPaused) {
        state.current.time += dt;
        update(dt, canvas.width, canvas.height);
      }
      
      draw(ctx, canvas.width, canvas.height);

      if (state.current.score >= targetScore) {
        onComplete();
      } else {
        animationFrameId = requestAnimationFrame(loop);
      }
    };
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [level, onComplete]);

  const update = (dt: number, width: number, height: number) => {
    const s = state.current;
    
    if (s.playerX === -1) {
      s.playerX = width / 2;
      s.targetPlayerX = width / 2;
    }

    if (s.freezeTimer > 0) {
      s.freezeTimer -= dt;
      if (s.freezeTimer < 0) s.freezeTimer = 0;
      s.targetPlayerX = s.playerX;
    } else {
      const margin = 50;
      const moveSpeed = width * 0.4; // Scale speed with screen width
      if (s.keys.left) s.targetPlayerX -= moveSpeed * dt;
      if (s.keys.right) s.targetPlayerX += moveSpeed * dt;
      s.targetPlayerX = Math.max(margin, Math.min(width - margin, s.targetPlayerX));
      
      // Smooth player movement
      s.playerX += (s.targetPlayerX - s.playerX) * 10.0 * dt; // Increased lerp for snappier keyboard response
    }
    
    // Spawning
    s.nextSpawn -= dt;
    if (s.nextSpawn <= 0) {
      s.nextSpawn = 0.5 + Math.random() * 0.5; // Spawn every 0.5-1.0 seconds
      let collectChance = 0.5; // Default (Level 1 & 3): 50% collect, 50% avoid
      if (level === 2) {
        collectChance = 0.35; // Level 2: 35% collect (gas), 65% avoid (cars)
      } else if (level === 4) {
        collectChance = 0.40; // Level 4: 40% collect (treasure), 60% avoid (tigers)
      }
      const isCollect = Math.random() < collectChance;
      let radius = isCollect ? 30 : 40;
      if (level === 2 && !isCollect) {
        radius = 60; // Make blue cars the same size as player
      } else if (level === 3 && !isCollect) {
        radius = 55; // Make jellyfishes slightly bigger
      } else if (level === 4) {
        radius = isCollect ? 35 : 55; // Treasure 35, Tiger 55
      }

      let spawnWidth = width * 0.8;
      if (level === 2 || level === 4) {
        // Road/Path width is width * 0.7, so keep entities fully on the street/path
        spawnWidth = width * 0.7 - (radius * 2 + 10);
      }

      s.entities.push({
        id: Math.random(),
        type: isCollect ? 'collect' : 'avoid',
        x: width / 2 + (Math.random() - 0.5) * spawnWidth,
        y: -100,
        radius: radius,
        speed: (height * 0.2 + Math.random() * height * 0.1),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 5,
      });
    }

    const playerWorldX = s.playerX;
    const playerWorldY = height * 0.8;
    const playerRadius = 60;

    // Update entities
    for (let i = s.entities.length - 1; i >= 0; i--) {
      const e = s.entities[i];
      e.y += e.speed * dt;
      e.rotation += e.rotSpeed * dt;

      // Trail effect for collectibles
      if (e.type === 'collect' && Math.random() < 0.4) { // 40% chance per frame
        s.particles.push({
          x: e.x + (Math.random() - 0.5) * e.radius,
          y: e.y + (Math.random() - 0.5) * e.radius,
          vx: (Math.random() - 0.5) * 10,
          vy: -e.speed * 0.1 + (Math.random() - 0.5) * 10,
          life: 0.2 + Math.random() * 0.3, // short life
          color: getCollectColor(level)
        });
      }

      // Collision
      const dx = e.x - playerWorldX;
      const dy = e.y - playerWorldY;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < playerRadius + e.radius) {
        if (e.type === 'collect') {
          playDing();
          s.score++;
          setScore(s.score);
          spawnParticles(e.x, e.y, getCollectColor(level));
        } else {
          playBoing();
          s.freezeTimer = 1.2;
          spawnParticles(e.x, e.y, getAvoidColor(level));
        }
        s.entities.splice(i, 1);
        continue;
      }

      if (e.y > height + 100) {
        s.entities.splice(i, 1);
      }
    }

    // Update particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      state.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        color
      });
    }
  };

  const getCollectColor = (l: number) => l === 1 ? '#FDE047' : l === 2 ? '#EF4444' : '#F472B6';
  const getAvoidColor = (l: number) => l === 1 ? '#9CA3AF' : l === 2 ? '#F97316' : '#E879F9';

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const s = state.current;
    
    // Background
    if (level === 1) {
      // Deep space gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#020617'); // Very dark blue/slate
      bgGrad.addColorStop(1, '#1e1b4b'); // Deep purple
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant nebulas/galaxies (slow moving)
      for (let i = 0; i < 4; i++) {
        const randX = Math.abs(Math.sin(i * 12.34) * 10000);
        const randY = Math.abs(Math.cos(i * 56.78) * 10000);
        const nx = randX % width;
        const ny = (randY % height + s.time * 15) % (height * 1.5) - height * 0.25;
        const radius = 250 + (i * 80);
        
        const rGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
        const colors = ['rgba(147, 51, 234, 0.12)', 'rgba(56, 189, 248, 0.1)', 'rgba(236, 72, 153, 0.1)', 'rgba(16, 185, 129, 0.08)'];
        rGrad.addColorStop(0, colors[i % colors.length]);
        rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Parallax Stars
      for(let i = 0; i < 150; i++) {
        const randX = Math.abs(Math.sin(i * 23.45) * 10000);
        const randY = Math.abs(Math.cos(i * 67.89) * 10000);
        
        const layer = (i % 3) + 1; // 1, 2, or 3 (3 being closest)
        const speed = layer * 40;
        
        const sx = randX % width;
        const sy = (randY % height + s.time * speed) % height;
        const size = (i % 3 === 0) ? layer * 0.8 : layer * 0.5;
        
        // Slightly colorize some stars
        if (i % 5 === 0) ctx.fillStyle = '#93c5fd'; // Pale blue
        else if (i % 7 === 0) ctx.fillStyle = '#fef08a'; // Pale yellow
        else if (i % 11 === 0) ctx.fillStyle = '#fbcfe8'; // Pale pink
        else ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + 0.2 * layer})`; // White with varied opacity
        
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle glow to larger stars
        if (size >= 1.5) {
           ctx.fillStyle = 'rgba(255,255,255,0.15)';
           ctx.beginPath();
           ctx.arc(sx, sy, size * 2.5, 0, Math.PI * 2);
           ctx.fill();
        }
      }
    } else if (level === 2) {
      // Grass with a subtle dark gradient at the edges
      const grassGrad = ctx.createLinearGradient(0, 0, width, 0);
      grassGrad.addColorStop(0, '#166534'); // Dark green edge
      grassGrad.addColorStop(0.2, '#22c55e'); // Medium green
      grassGrad.addColorStop(0.8, '#22c55e');
      grassGrad.addColorStop(1, '#166534');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 0, width, height);

      const roadWidth = width * 0.7;
      const roadX = width / 2 - roadWidth / 2;

      // Moving Scenery (Trees and bushes on the side)
      for (let i = 0; i < 14; i++) {
        const isLeft = i % 2 === 0;
        const baseTx = isLeft ? roadX * 0.5 : width - roadX * 0.5;
        const randOffset = Math.sin(i * 123.45) * 40;
        const tx = baseTx + randOffset;
        
        // All bushes move at the same speed now
        const ty = ((i * 150) + s.time * 250) % (height + 300) - 150;
        
        ctx.save();
        ctx.translate(tx, ty);
        
        // Tree shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 30, 40, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main canopy
        ctx.fillStyle = (i % 3 === 0) ? '#064e3b' : '#065f46'; // varied dark greens
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.arc(-20, -15, 30, 0, Math.PI * 2);
        ctx.arc(20, -10, 35, 0, Math.PI * 2);
        ctx.arc(0, -30, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Canopy highlights
        ctx.fillStyle = (i % 3 === 0) ? '#059669' : '#10b981';
        ctx.beginPath();
        ctx.arc(-10, -15, 25, 0, Math.PI * 2);
        ctx.arc(10, 5, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      // Road Asphalt Gradient (shadowed at the edges)
      const roadGrad = ctx.createLinearGradient(roadX, 0, roadX + roadWidth, 0);
      roadGrad.addColorStop(0, '#374151'); // dark gray
      roadGrad.addColorStop(0.1, '#4b5563'); // lighter gray
      roadGrad.addColorStop(0.9, '#4b5563');
      roadGrad.addColorStop(1, '#374151');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(roadX, 0, roadWidth, height);
      
      // Rumble strips / Shoulders
      ctx.fillStyle = '#cbd5e1'; // light gray/white
      ctx.fillRect(roadX + 15, 0, 8, height);
      ctx.fillRect(roadX + roadWidth - 23, 0, 8, height);

      // Center dashed yellow lines (dual lines)
      ctx.fillStyle = '#fef08a';
      const lineLen = 80;
      const gap = 60;
      const totalLine = lineLen + gap;
      const numLines = Math.ceil(height / totalLine) + 1;
      
      for(let i = 0; i < numLines; i++) {
        const ly = ((i * totalLine) + s.time * 250) % (height + totalLine) - totalLine;
        ctx.fillRect(width / 2 - 12, ly, 8, lineLen);
        ctx.fillRect(width / 2 + 4, ly, 8, lineLen);
      }
    } else if (level === 3) {
      // 1. Deep Ocean Gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, '#0284c7'); // Mid ocean blue
      oceanGrad.addColorStop(0.5, '#0369a1'); // Deeper blue
      oceanGrad.addColorStop(1, '#0f172a'); // Deep dark abyss
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);
      
      // 2. Light Shafts (God Rays) filtering from surface
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const topX = (i * width * 0.2) + Math.sin(s.time * 0.4 + i) * 60;
        const bottomX = topX + 200 + Math.sin(s.time * 0.2 + i) * 120;
        ctx.moveTo(topX - 50, 0);
        ctx.lineTo(topX + 50, 0);
        ctx.lineTo(bottomX + 150, height);
        ctx.lineTo(bottomX - 150, height);
        ctx.fill();
      }

      // 3. Background Deep Sea Rocks (Parallax) moving DOWN
      ctx.fillStyle = 'rgba(8, 47, 73, 0.5)'; // Dark ocean silhouette
      for (let i = 0; i < 6; i++) {
        const isLeft = i % 2 === 0;
        const rockW = 120 + (i * 30);
        const rockH = 250 + (i * 50);
        
        // Move downwards
        const speedMultiplier = 1 + (i % 3) * 0.3;
        const ry = ((i * 300) + s.time * 120 * speedMultiplier) % (height + rockH * 2) - rockH;
        
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(0, ry);
          ctx.quadraticCurveTo(rockW, ry + rockH/2, 0, ry + rockH);
        } else {
          ctx.moveTo(width, ry);
          ctx.quadraticCurveTo(width - rockW, ry + rockH/2, width, ry + rockH);
        }
        ctx.fill();
      }

      // 4. Ambient Plankton/Dust moving DOWN
      ctx.fillStyle = 'rgba(125, 211, 252, 0.3)'; // Pale blue specks
      for (let i = 0; i < 40; i++) {
        const px = Math.abs(Math.sin(i * 99) * width);
        const py = ((i * 45) + s.time * 90) % height;
        const pSize = (i % 3) + 1;
        
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Advanced Bubbles rising UP
      for(let i = 0; i < 25; i++) {
        const speed = (i % 3 + 1) * 40;
        const baseBx = Math.abs(Math.cos(i * 321) * width);
        const wobble = Math.sin(s.time * 2 + i) * 20;
        const bx = baseBx + wobble;
        
        const by = (height + 100) - ((i * 90 + s.time * speed) % (height + 200));
        const r = (i % 4 + 1) * 5;
        
        // Bubble body
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Bubble highlight reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (level === 4) {
      // Jungle Background
      // Forest Floor (Deep canopy green)
      const jungleGrad = ctx.createLinearGradient(0, 0, width, 0);
      jungleGrad.addColorStop(0, '#022c22'); // Very dark green edge
      jungleGrad.addColorStop(0.2, '#064e3b'); // Medium dark green
      jungleGrad.addColorStop(0.8, '#064e3b');
      jungleGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = jungleGrad;
      ctx.fillRect(0, 0, width, height);

      const pathWidth = width * 0.7;
      const pathX = width / 2 - pathWidth / 2;

      // Mossy/Grass Path instead of brown dirt
      const pathGrad = ctx.createLinearGradient(pathX, 0, pathX + pathWidth, 0);
      pathGrad.addColorStop(0, '#14532d');
      pathGrad.addColorStop(0.5, '#166534');
      pathGrad.addColorStop(1, '#14532d');
      ctx.fillStyle = pathGrad;
      ctx.fillRect(pathX, 0, pathWidth, height);
      
      // Path edge details (small plants/moss)
      ctx.fillStyle = '#059669';
      for (let i = 0; i < Math.ceil(height / 40) + 1; i++) {
        const yPos = (i * 40 + s.time * 150) % (height + 40) - 40;
        ctx.beginPath();
        ctx.arc(pathX + Math.sin(i * 1.5) * 5 + 8, yPos, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pathX + pathWidth - Math.sin(i * 1.5) * 5 - 8, yPos, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Moving ambient fireflies/spores for extra detail
      ctx.fillStyle = 'rgba(110, 231, 183, 0.6)';
      for (let i = 0; i < 35; i++) {
        const px = Math.abs(Math.sin(i * 77) * width);
        const py = ((i * 50) + s.time * 80) % height;
        const pSize = (i % 2) + 1.5;
        const wobble = Math.cos(s.time * 3 + i) * 15;
        ctx.beginPath();
        ctx.arc(px + wobble, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moving Jungle Scenery (Vines, ferns, and large leaves)
      for (let i = 0; i < 20; i++) {
        const isLeft = i % 2 === 0;
        const baseTx = isLeft ? pathX * 0.35 : width - pathX * 0.35;
        const randOffset = Math.sin(i * 123.45) * 60;
        const tx = baseTx + randOffset;
        
        const ty = ((i * 130) + s.time * 250) % (height + 300) - 150;
        
        // Leaf shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(tx + 5, ty + 10, 60 + (i % 4) * 20, 0, Math.PI * 2);
        ctx.fill();

        // Main leaf base
        ctx.fillStyle = (i % 3 === 0) ? '#065f46' : '#047857'; // Emerald shades
        ctx.beginPath();
        ctx.arc(tx, ty, 60 + (i % 4) * 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Smaller leaf inside for detail
        ctx.fillStyle = '#10b981'; 
        ctx.beginPath();
        ctx.arc(tx + (isLeft ? 15 : -15), ty - 10, 30 + (i % 4) * 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Extra fern-like fronds
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.ellipse(tx + (isLeft ? -20 : 20), ty + 20, 25, 8, isLeft ? Math.PI/4 : -Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const drawObject = (x: number, y: number, r: number, drawFn: () => void) => {
      ctx.save();
      ctx.translate(x, y);
      drawFn();
      ctx.restore();
    };

    // Entities
    for (const e of s.entities) {
      drawObject(e.x, e.y, e.radius, () => {
        if ((level === 2 || level === 4) && e.type === 'avoid') {
          // Do not rotate obstacle cars or tigers, keep them facing up/down
          if (level === 4 && e.type === 'avoid') {
            ctx.rotate(Math.PI); // Tigers face downwards towards player
          }
        } else {
          ctx.rotate(e.rotation);
        }
        
        if (level === 1) {
          if (e.type === 'collect') drawStar(ctx, e.radius);
          else drawAsteroid(ctx, e.radius);
        } else if (level === 2) {
          if (e.type === 'collect') drawGasCan(ctx, e.radius);
          else drawCar(ctx, e.radius, '#3B82F6'); // Blue obstacle car
        } else if (level === 3) {
          if (e.type === 'collect') drawShell(ctx, e.radius);
          else drawJellyfish(ctx, e.radius);
        } else if (level === 4) {
          if (e.type === 'collect') drawTreasureChest(ctx, e.radius);
          else drawTiger(ctx, e.radius);
        }
      });
    }

    // Player
    let drawPlayer = true;
    if (s.freezeTimer > 0) {
      // Blink every 0.15s
      if (Math.floor(s.freezeTimer / 0.15) % 2 === 0) {
        drawPlayer = false;
      }
    }

    if (drawPlayer) {
      ctx.save();
      ctx.translate(s.playerX, height * 0.8);
      if (level === 1) drawRocket(ctx, 60);
      else if (level === 2) drawCar(ctx, 60);
      else if (level === 3) drawSubmarine(ctx, 60);
      else if (level === 4) drawHunter(ctx, 60);
      ctx.restore();
    }

    // Particles
    for (const p of s.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    // Move player towards mouse X, clamped to screen margins
    const margin = 50;
    state.current.targetPlayerX = Math.max(margin, Math.min(width - margin, clientX));
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden touch-none ${!isPaused ? 'cursor-none' : ''}`}
      onPointerMove={(e) => handleMove(e.clientX)}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
        <div className="bg-white/90 px-6 py-3 rounded-full text-3xl font-black text-gray-800 shadow-lg border-4 border-gray-200">
          Level {level}
        </div>
        <div className="bg-white/90 px-6 py-3 rounded-full text-3xl font-black text-gray-800 shadow-lg border-4 border-gray-200">
          Score: {score} / {targetScore}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-64 h-8 bg-white/50 rounded-full border-4 border-white/80 overflow-hidden shadow-lg pointer-events-none">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
          style={{ width: `${(score / targetScore) * 100}%` }}
        />
      </div>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 flex flex-col items-center shadow-2xl border-8 border-gray-200 pointer-events-auto">
            <h2 className="text-6xl font-black text-gray-800 mb-10 drop-shadow-sm">PAUSED</h2>
            <button 
              onClick={() => {
                setIsPaused(false);
                state.current.isPaused = false;
                resumeMusic();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-4xl py-4 px-12 rounded-full shadow-lg mb-6 transform transition hover:scale-105 active:scale-95 border-4 border-blue-700 w-full"
            >
              Resume
            </button>
            <button 
              onClick={() => {
                stopMusic();
                onQuit();
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold text-3xl py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 border-4 border-red-700 w-full"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Drawing helpers
function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * r, -Math.sin((18 + i * 72) / 180 * Math.PI) * r);
    ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (r * 0.5), -Math.sin((54 + i * 72) / 180 * Math.PI) * (r * 0.5));
  }
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#CA8A04';
  ctx.stroke();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  
  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // Base irregular shape
  ctx.fillStyle = '#6B7280'; // Darker gray
  ctx.beginPath();
  const points = 12;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    // Deterministic jaggedness
    const rad = r * (0.85 + Math.sin(i * 2.5) * 0.15 * Math.cos(i * 7));
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#374151'; // Dark border
  ctx.stroke();

  // Inner highlight polygon for depth
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#9CA3AF'; // Lighter gray highlight
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rad = r * (0.65 + Math.sin(i * 2.5) * 0.1 * Math.cos(i * 7));
    const offsetX = -r * 0.15;
    const offsetY = -r * 0.15;
    if (i === 0) ctx.moveTo(offsetX + Math.cos(a) * rad, offsetY + Math.sin(a) * rad);
    else ctx.lineTo(offsetX + Math.cos(a) * rad, offsetY + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();

  // Craters
  const drawCrater = (x: number, y: number, cr: number) => {
    ctx.fillStyle = '#4B5563'; // Crater floor
    ctx.beginPath();
    ctx.arc(x, y, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#374151'; // Crater rim
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner crater shadow for extra depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(x - cr*0.1, y - cr*0.1, cr*0.7, 0, Math.PI * 2);
    ctx.fill();
  };

  drawCrater(-r*0.25, r*0.25, r*0.25);
  drawCrater(r*0.35, -r*0.25, r*0.18);
  drawCrater(r*0.25, r*0.35, r*0.12);
  drawCrater(-r*0.3, -r*0.3, r*0.15);

  ctx.restore();
}

function drawGasCan(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-r*0.6, -r*0.8, r*1.2, r*1.6);
  ctx.fillStyle = '#FCD34D'; // nozzle
  ctx.fillRect(r*0.2, -r*1.1, r*0.3, r*0.3);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-r*0.2, -r*0.2, r*0.4, r*0.6); // label
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#991B1B';
  ctx.strokeRect(-r*0.6, -r*0.8, r*1.2, r*1.6);
}

function drawCone(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, r);
  ctx.lineTo(-r, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(-r*0.5, 0);
  ctx.lineTo(r*0.5, 0);
  ctx.lineTo(r*0.75, r*0.5);
  ctx.lineTo(-r*0.75, r*0.5);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#C2410C';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, r);
  ctx.lineTo(-r, r);
  ctx.closePath();
  ctx.stroke();
}

function drawShell(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  
  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // Hinge at bottom
  ctx.fillStyle = '#FB7185';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-r*0.3, r*0.5, r*0.6, r*0.3, r*0.15);
  } else {
    ctx.fillRect(-r*0.3, r*0.5, r*0.6, r*0.3);
  }
  ctx.fill();

  // Main fan shape
  ctx.fillStyle = '#FFE4E6'; 
  ctx.strokeStyle = '#FB7185';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(0, r*0.6); // start at hinge center
  
  // Left edge
  ctx.bezierCurveTo(-r*0.8, r*0.4, -r, -r*0.2, -r*0.8, -r*0.6);
  // Top scalloped edge
  ctx.bezierCurveTo(-r*0.4, -r*1.0, r*0.4, -r*1.0, r*0.8, -r*0.6);
  // Right edge
  ctx.bezierCurveTo(r, -r*0.2, r*0.8, r*0.4, 0, r*0.6);
  
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Radiating ridges
  ctx.beginPath();
  ctx.moveTo(0, r*0.6);
  ctx.lineTo(-r*0.65, -r*0.4);
  
  ctx.moveTo(0, r*0.6);
  ctx.lineTo(-r*0.35, -r*0.75);

  ctx.moveTo(0, r*0.6);
  ctx.lineTo(0, -r*0.9);

  ctx.moveTo(0, r*0.6);
  ctx.lineTo(r*0.35, -r*0.75);

  ctx.moveTo(0, r*0.6);
  ctx.lineTo(r*0.65, -r*0.4);
  
  ctx.stroke();

  // Pearl inside
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, r*0.1, r*0.25, 0, Math.PI*2);
  ctx.fill();
  
  // Pearl shine
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(-r*0.08, r*0.05, r*0.08, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawJellyfish(ctx: CanvasRenderingContext2D, r: number) {
  // Use shades of orange and purple for better contrast against the deep blue background
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, 'rgba(249, 115, 22, 0.95)'); // Bright orange
  grad.addColorStop(1, 'rgba(168, 85, 247, 0.95)'); // Vibrant purple

  ctx.fillStyle = grad;
  
  // Jellyfish cap (dome)
  ctx.beginPath();
  // more bell-like shape
  ctx.moveTo(-r, 0);
  ctx.bezierCurveTo(-r, -r * 1.6, r, -r * 1.6, r, 0);
  // bottom of the cap (wavy)
  ctx.quadraticCurveTo(r * 0.5, -r * 0.2, 0, 0);
  ctx.quadraticCurveTo(-r * 0.5, -r * 0.2, -r, 0);
  ctx.fill();
  
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(217, 70, 239, 0.8)'; // fuchsia/purple outline
  ctx.stroke();

  // inner details (spots for depth)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.5, r * 0.15, r * 0.25, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.4, -r * 0.5, r * 0.1, r * 0.15, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.8, r * 0.08, r * 0.12, Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();

  // Main thick tentacles (Purple)
  ctx.strokeStyle = 'rgba(192, 38, 211, 0.9)'; // Darker purple
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  const numTentacles = 5;
  for(let i = 0; i < numTentacles; i++) {
    const xOffset = -r * 0.8 + (r * 1.6 * (i / (numTentacles - 1)));
    ctx.beginPath();
    ctx.moveTo(xOffset, -r * 0.1);
    
    // Wavy tentacles
    const ctrl1X = xOffset + r * 0.6;
    const ctrl1Y = r * 0.8;
    const ctrl2X = xOffset - r * 0.6;
    const ctrl2Y = r * 1.5;
    const endX = xOffset;
    const endY = r * 2.2;
    
    ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
    ctx.stroke();
  }

  // Inner thin tentacles (Orange)
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.9)'; // Orange
  ctx.lineWidth = 1.5;
  for(let i = 0; i < 4; i++) {
    const xOffset = -r * 0.5 + (r * 1.0 * (i / 3));
    ctx.beginPath();
    ctx.moveTo(xOffset, 0);
    ctx.quadraticCurveTo(xOffset - r * 0.4, r, xOffset + r * 0.3, r * 1.8);
    ctx.stroke();
  }
}

function drawRocket(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  
  const w = r * 0.45;
  const l = r * 1.0;

  // Engine exhaust / Fire (Flickering)
  // Drawn first so it goes behind the rocket
  ctx.fillStyle = '#F97316'; // Orange outer flame
  ctx.beginPath();
  ctx.moveTo(-w*0.6, l*0.7);
  ctx.lineTo(0, l*1.5 + Math.random() * r * 0.4);
  ctx.lineTo(w*0.6, l*0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FEF08A'; // Yellow inner flame
  ctx.beginPath();
  ctx.moveTo(-w*0.3, l*0.7);
  ctx.lineTo(0, l*1.2 + Math.random() * r * 0.2);
  ctx.lineTo(w*0.3, l*0.7);
  ctx.closePath();
  ctx.fill();

  // Shadow for the solid parts of the rocket
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;

  // Engine Nozzle
  ctx.fillStyle = '#4B5563'; // Dark Gray
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w*0.7, l*0.6, w*1.4, l*0.25, 4);
  } else {
    ctx.fillRect(-w*0.7, l*0.6, w*1.4, l*0.25);
  }
  ctx.fill();

  // Side Fins
  ctx.fillStyle = '#EF4444'; // Red
  
  // Left Fin
  ctx.beginPath();
  ctx.moveTo(-w*0.6, l*0.1);
  ctx.lineTo(-w*1.8, l*0.8);
  ctx.lineTo(-w*0.7, l*0.8);
  ctx.closePath();
  ctx.fill();

  // Right Fin
  ctx.beginPath();
  ctx.moveTo(w*0.6, l*0.1);
  ctx.lineTo(w*1.8, l*0.8);
  ctx.lineTo(w*0.7, l*0.8);
  ctx.closePath();
  ctx.fill();

  // Main Fuselage (Sleek aerodynamic curve)
  ctx.fillStyle = '#F3F4F6'; // Light gray / off-white
  ctx.beginPath();
  ctx.moveTo(0, -l);
  ctx.bezierCurveTo(w*1.2, -l*0.4, w*1.1, l*0.5, w*0.8, l*0.7);
  ctx.lineTo(-w*0.8, l*0.7);
  ctx.bezierCurveTo(-w*1.1, l*0.5, -w*1.2, -l*0.4, 0, -l);
  ctx.closePath();
  ctx.fill();

  // 3D Shading on fuselage (right side darker)
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.moveTo(0, -l);
  ctx.bezierCurveTo(w*1.2, -l*0.4, w*1.1, l*0.5, w*0.8, l*0.7);
  ctx.lineTo(0, l*0.7);
  ctx.closePath();
  ctx.fill();

  // Nose Cone (Red Tip)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -l);
  ctx.bezierCurveTo(w*1.2, -l*0.4, w*1.1, l*0.5, w*0.8, l*0.7);
  ctx.lineTo(-w*0.8, l*0.7);
  ctx.bezierCurveTo(-w*1.1, l*0.5, -w*1.2, -l*0.4, 0, -l);
  ctx.closePath();
  ctx.clip(); // Clip everything to the fuselage shape

  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-w*2, -l, w*4, l*0.6); // Top red part
  ctx.restore();

  // Center Tail Fin
  ctx.fillStyle = '#B91C1C'; // Darker red for depth
  ctx.beginPath();
  ctx.moveTo(0, l*0.3);
  ctx.lineTo(-w*0.1, l*0.9);
  ctx.lineTo(w*0.1, l*0.9);
  ctx.closePath();
  ctx.fill();

  // Porthole (Window) Outer Rim
  ctx.fillStyle = '#9CA3AF'; // Metallic gray rim
  ctx.beginPath();
  ctx.arc(0, -l*0.1, r*0.35, 0, Math.PI*2);
  ctx.fill();

  // Porthole Inner Glass
  ctx.fillStyle = '#0EA5E9'; // Deep sky blue
  ctx.beginPath();
  ctx.arc(0, -l*0.1, r*0.25, 0, Math.PI*2);
  ctx.fill();

  // Glass Reflection (Shine)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(-r*0.1, -l*0.1 - r*0.08, r*0.08, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, r: number, color: string = '#EF4444') {
  const w = r * 0.6;
  const l = r;
  
  // Body shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w - 2, -l - 2, w*2 + 4, l*2 + 4, 12);
  } else {
    ctx.rect(-w - 2, -l - 2, w*2 + 4, l*2 + 4);
  }
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#111827'; // Dark gray/black
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w - 6, -l + 10, 10, 20, 3); // front left
    ctx.roundRect(w - 4, -l + 10, 10, 20, 3); // front right
    ctx.roundRect(-w - 6, l - 25, 10, 20, 3); // rear left
    ctx.roundRect(w - 4, l - 25, 10, 20, 3); // rear right
  } else {
    ctx.fillRect(-w - 6, -l + 10, 10, 20);
    ctx.fillRect(w - 4, -l + 10, 10, 20);
    ctx.fillRect(-w - 6, l - 25, 10, 20);
    ctx.fillRect(w - 4, l - 25, 10, 20);
  }
  ctx.fill();

  // Main body
  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w, -l, w*2, l*2, 12);
  } else {
    ctx.rect(-w, -l, w*2, l*2);
  }
  ctx.fill();

  // Roof / cabin
  const darkerColor = color === '#EF4444' ? '#B91C1C' : '#1D4ED8'; 
  ctx.fillStyle = darkerColor;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w + 6, -l + 25, w*2 - 12, l*1.1, 8);
  } else {
    ctx.rect(-w + 6, -l + 25, w*2 - 12, l*1.1);
  }
  ctx.fill();

  // Windshield (front)
  ctx.fillStyle = '#93C5FD'; // light blue glass
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w + 8, -l + 27, w*2 - 16, 18, 4);
  } else {
    ctx.rect(-w + 8, -l + 27, w*2 - 16, 18);
  }
  ctx.fill();

  // Rear window
  ctx.fillStyle = '#93C5FD';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w + 8, l - 18, w*2 - 16, 12, 3);
  } else {
    ctx.rect(-w + 8, l - 18, w*2 - 16, 12);
  }
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#FEF08A'; // yellow
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w + 4, -l + 2, 10, 6, 3);
    ctx.roundRect(w - 14, -l + 2, 10, 6, 3);
  } else {
    ctx.rect(-w + 4, -l + 2, 10, 6);
    ctx.rect(w - 14, -l + 2, 10, 6);
  }
  ctx.fill();

  // Taillights
  ctx.fillStyle = '#F87171'; // red
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w + 4, l - 6, 12, 4, 2);
    ctx.roundRect(w - 16, l - 6, 12, 4, 2);
  } else {
    ctx.rect(-w + 4, l - 6, 12, 4);
    ctx.rect(w - 16, l - 6, 12, 4);
  }
  ctx.fill();
  
  // Side mirrors
  ctx.fillStyle = darkerColor;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w - 3, -l + 32, 4, 8, 2);
    ctx.roundRect(w - 1, -l + 32, 4, 8, 2);
  } else {
    ctx.rect(-w - 3, -l + 32, 4, 8);
    ctx.rect(w - 1, -l + 32, 4, 8);
  }
  ctx.fill();
}

function drawSubmarine(ctx: CanvasRenderingContext2D, r: number) {
  const w = r * 0.5;
  const l = r * 1.1;
  
  ctx.save();
  
  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  
  // 1. Hydroplanes (Front fins)
  ctx.fillStyle = '#EAB308'; // darker yellow
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w - r*0.4, -l*0.6, w*2 + r*0.8, r*0.3, r*0.1);
  } else {
    ctx.rect(-w - r*0.4, -l*0.6, w*2 + r*0.8, r*0.3);
  }
  ctx.fill();

  // 2. Rear fins (Tail planes)
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w - r*0.3, l*0.6, w*2 + r*0.6, r*0.4, r*0.1);
  } else {
    ctx.rect(-w - r*0.3, l*0.6, w*2 + r*0.6, r*0.4);
  }
  ctx.fill();
  
  // 3. Propeller at back
  ctx.fillStyle = '#9CA3AF'; // Gray
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-r*0.2, l*0.9, r*0.4, r*0.3, r*0.1); // Shaft
    ctx.roundRect(-r*0.5, l*1.0, r*1.0, r*0.15, r*0.05); // Blades
  } else {
    ctx.rect(-r*0.2, l*0.9, r*0.4, r*0.3);
    ctx.rect(-r*0.5, l*1.0, r*1.0, r*0.15);
  }
  ctx.fill();

  // 4. Main Hull (Pill shape)
  ctx.shadowColor = 'transparent'; // stop shadow for body layering
  ctx.fillStyle = '#FDE047'; // Bright Yellow
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w, -l, w*2, l*2, w); // fully rounded ends
  } else {
    ctx.rect(-w, -l, w*2, l*2);
  }
  ctx.fill();

  // Highlight on hull
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w*0.5, -l*0.8, w, l*1.6, w*0.5);
  } else {
    ctx.rect(-w*0.5, -l*0.8, w, l*1.6);
  }
  ctx.fill();

  // 5. Sail (Conning Tower in the middle)
  ctx.fillStyle = '#EAB308'; // darker yellow/orange
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w*0.6, -l*0.1, w*1.2, l*0.6, w*0.4);
  } else {
    ctx.rect(-w*0.6, -l*0.1, w*1.2, l*0.6);
  }
  ctx.fill();

  // 6. Hatches / Details on Sail
  ctx.fillStyle = '#9CA3AF'; // Gray
  ctx.beginPath();
  ctx.arc(0, l*0.25, r*0.2, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#1F2937'; // Dark inside
  ctx.beginPath();
  ctx.arc(0, l*0.25, r*0.15, 0, Math.PI*2);
  ctx.fill();

  // 7. Periscope protruding from sail (pointing forward)
  ctx.fillStyle = '#6B7280'; // Dark Gray
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-r*0.08, -l*0.3, r*0.16, l*0.3, r*0.05); // mast
    ctx.roundRect(-r*0.12, -l*0.35, r*0.24, r*0.15, r*0.05); // lens head
  } else {
    ctx.rect(-r*0.08, -l*0.3, r*0.16, l*0.3);
    ctx.rect(-r*0.12, -l*0.35, r*0.24, r*0.15);
  }
  ctx.fill();
  
  // Lens light/glow
  ctx.fillStyle = '#38BDF8'; 
  ctx.beginPath();
  ctx.arc(0, -l*0.35 + r*0.07, r*0.05, 0, Math.PI*2);
  ctx.fill();
  
  // Front window/glass on hull
  ctx.fillStyle = '#0284C7'; // Blue
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w*0.5, -l + r*0.3, w, r*0.25, r*0.1);
  } else {
    ctx.rect(-w*0.5, -l + r*0.3, w, r*0.25);
  }
  ctx.fill();

  ctx.restore();
}

function drawHunter(ctx: CanvasRenderingContext2D, r: number) {
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
  ctx.ellipse(-r * 0.45, r * 0.05, r * 0.12, r * 0.25, Math.PI/12, 0, Math.PI * 2);
  ctx.fill();
  // Right Arm
  ctx.beginPath();
  ctx.ellipse(r * 0.45, r * 0.05, r * 0.12, r * 0.25, -Math.PI/12, 0, Math.PI * 2);
  ctx.fill();
  
  // Hands (relaxed, pointing down/backwards towards positive Y)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(-r * 0.52, r * 0.28, r * 0.11, 0, Math.PI * 2);
  ctx.arc(r * 0.52, r * 0.28, r * 0.11, 0, Math.PI * 2);
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

function drawTreasureChest(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  // Chest base (wood)
  ctx.fillStyle = '#78350f';
  if (ctx.roundRect) {
    ctx.roundRect(-r * 0.7, -r * 0.5, r * 1.4, r * 1.0, r * 0.1);
  } else {
    ctx.rect(-r * 0.7, -r * 0.5, r * 1.4, r * 1.0);
  }
  ctx.fill();

  // Gold inside / top edge
  ctx.fillStyle = '#fbbf24'; // Gold
  ctx.fillRect(-r * 0.6, -r * 0.4, r * 1.2, r * 0.3);

  // Metal bands
  ctx.fillStyle = '#9ca3af'; // Gray metal
  ctx.fillRect(-r * 0.5, -r * 0.5, r * 0.2, r * 1.0);
  ctx.fillRect(r * 0.3, -r * 0.5, r * 0.2, r * 1.0);
  
  // Lock
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTiger(ctx: CanvasRenderingContext2D, r: number) {
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
