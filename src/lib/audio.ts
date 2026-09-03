const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let ctx: AudioContext | null = null;
let isPlaying = false;
let nextNoteTime = 0;
let step = 0;
let timeoutId: any = null;
let currentLevel = 1;

export function initAudio() {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

function playTone(freq: number, type: OscillatorType, duration: number, vol: number, time: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
  osc.stop(time + duration);
}

export function playDing() {
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(880, 'sine', 0.1, 0.3, now);
  playTone(1760, 'sine', 0.3, 0.2, now + 0.1);
}

export function playBoing() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc.stop(now + 0.3);
}

function scheduleMusic() {
  if (!isPlaying || !ctx) return;
  
  const lookahead = 0.1;
  while (nextNoteTime < ctx.currentTime + lookahead) {
    if (currentLevel === 0) { // Main Menu
      const notes = [
        261.63, 329.63, 392.00, 523.25, 392.00, 329.63, // C major
        196.00, 246.94, 293.66, 392.00, 293.66, 246.94, // G major
        220.00, 261.63, 329.63, 440.00, 329.63, 261.63, // A minor
        174.61, 220.00, 261.63, 349.23, 261.63, 220.00  // F major
      ];
      playTone(notes[step % notes.length], 'sine', 0.25, 0.02, nextNoteTime);
      nextNoteTime += 0.18;
    } else if (currentLevel === 1) { // Space - Sci-fi bleeps and arpeggios
      // Fast, driving 8-bit space bass
      const spaceBass = [
        130.81, 130.81, 196.00, 130.81, 261.63, 130.81, 196.00, 130.81, // C
        103.83, 103.83, 155.56, 103.83, 207.65, 103.83, 155.56, 103.83, // Ab
        116.54, 116.54, 174.61, 116.54, 233.08, 116.54, 174.61, 116.54, // Bb
        130.81, 130.81, 196.00, 130.81, 261.63, 130.81, 196.00, 130.81  // C
      ];
      
      const bFreq = spaceBass[step % spaceBass.length];
      playTone(bFreq, 'square', 0.1, 0.02, nextNoteTime);

      // Sci-fi alien lead melody (played on triangle for a softer, spacey feel)
      // Contains rests (0) and fast runs
      const spaceLead = [
        0, 0, 523.25, 0, 783.99, 0, 1046.50, 0, 
        932.33, 0, 783.99, 0, 622.25, 0, 0, 0,
        0, 0, 466.16, 0, 698.46, 0, 932.33, 0,
        830.61, 0, 698.46, 0, 523.25, 0, 0, 0
      ];
      
      const lFreq = spaceLead[step % spaceLead.length];
      if (lFreq > 0) {
        playTone(lFreq, 'triangle', 0.15, 0.015, nextNoteTime);
      }
      
      // Random "twinkling star" / computer blips occasionally
      if (step % 5 === 0) {
        const blipFreq = 1000 + Math.random() * 1500;
        playTone(blipFreq, 'sine', 0.05, 0.01, nextNoteTime);
      }

      nextNoteTime += 0.16; // Moderate driving tempo
    } else if (currentLevel === 2) { // Drive - Synthwave
      // Pumping Bassline (16th notes)
      const bassNotes = [
        65.41, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41, // C2
        77.78, 77.78, 77.78, 77.78, 77.78, 77.78, 77.78, 77.78, // Eb2
        87.31, 87.31, 87.31, 87.31, 87.31, 87.31, 87.31, 87.31, // F2
        55.00, 55.00, 55.00, 55.00, 55.00, 55.00, 55.00, 55.00  // G1
      ];
      const bFreq = bassNotes[step % bassNotes.length];
      playTone(bFreq, 'sawtooth', 0.12, 0.025, nextNoteTime); // short punchy bass
      
      // Chords (played on the downbeat of each measure)
      if (step % 8 === 0) {
        const chordRoots = [130.81, 155.56, 174.61, 110.00]; // C3, Eb3, F3, A2
        const rootIndex = Math.floor((step % 32) / 8);
        const root = chordRoots[rootIndex];
        playTone(root, 'square', 0.4, 0.015, nextNoteTime); // Root
        playTone(root * 1.498, 'square', 0.4, 0.015, nextNoteTime); // Perfect 5th
      }

      // Syncopated high melody
      const melodyNotes = [
        0, 392.00, 0, 523.25, 0, 0, 659.25, 0,
        0, 311.13, 0, 392.00, 0, 0, 466.16, 0,
        0, 349.23, 0, 440.00, 0, 0, 523.25, 0,
        0, 293.66, 0, 392.00, 0, 0, 440.00, 0
      ];
      const mFreq = melodyNotes[step % melodyNotes.length];
      if (mFreq > 0) {
        playTone(mFreq, 'square', 0.15, 0.015, nextNoteTime);
      }
      
      nextNoteTime += 0.14; // Fast, driving tempo
    } else if (currentLevel === 3) { // Ocean - Ambient & Atmospheric
      const chords = [
        [261.63, 329.63, 392.00, 523.25], // Cmaj
        [220.00, 261.63, 329.63, 440.00], // Amin
        [174.61, 220.00, 261.63, 349.23], // Fmaj
        [196.00, 246.94, 293.66, 392.00]  // Gmaj
      ];
      
      const chordIndex = Math.floor((step % 32) / 8);
      const currentChord = chords[chordIndex];
      
      // Deep resonant bass pad every 8 steps
      if (step % 8 === 0) {
        playTone(currentChord[0] / 2, 'sine', 3.5, 0.03, nextNoteTime); // Deep sub
        playTone(currentChord[0], 'triangle', 3.0, 0.02, nextNoteTime);
      }
      
      // Slow, sweeping arpeggio
      const notePatterns = [0, 1, 2, 3, 2, 1, 0, 1];
      const noteIndex = notePatterns[step % 8];
      const arpFreq = currentChord[noteIndex % 4];
      
      playTone(arpFreq, 'sine', 0.9, 0.02, nextNoteTime);
      
      // High-pitched shimmers for bubbles/water feel
      if (step % 4 === 1 || step % 4 === 3) {
         playTone(arpFreq * 2, 'sine', 0.6, 0.01, nextNoteTime);
         playTone(arpFreq * 2.01, 'sine', 0.6, 0.01, nextNoteTime); // Slight detune for chorus effect
      }

      nextNoteTime += 0.35; // Slow, relaxing tempo
    } else if (currentLevel === 4) { // Jungle - Chill & Rhythmic
      // Pentatonic scale for a natural, tribal feel (C, D, E, G, A)
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
      
      // Marimba-like bass (syncopated)
      const bassPattern = [
        130.81, 0, 0, 130.81, 0, 146.83, 0, 0,
        130.81, 0, 164.81, 0, 130.81, 0, 0, 0
      ];
      const bFreq = bassPattern[step % bassPattern.length];
      if (bFreq > 0) {
        playTone(bFreq, 'triangle', 0.15, 0.03, nextNoteTime);
      }
      
      // Conga/Bongo percussive hits
      if (step % 8 === 4) {
        playTone(196.00, 'square', 0.08, 0.015, nextNoteTime); // High hit
      }
      if (step % 8 === 7) {
        playTone(98.00, 'square', 0.1, 0.015, nextNoteTime); // Low hit
      }

      // Wooden clicks/shakers on off-beats
      if (step % 2 === 1) {
         playTone(800 + Math.random() * 200, 'square', 0.02, 0.005, nextNoteTime);
      }
      
      // Flute-like melody (sine wave), sparse and chill
      const melodyPattern = [
        0, 0, 0, scale[3], 0, scale[4], 0, 0,
        scale[5], 0, 0, scale[4], scale[2], 0, 0, 0,
        0, 0, scale[3], 0, scale[2], 0, scale[1], 0,
        scale[0], 0, 0, 0, 0, 0, 0, 0
      ];
      const mFreq = melodyPattern[step % melodyPattern.length];
      if (mFreq > 0) {
        playTone(mFreq, 'sine', 0.4, 0.02, nextNoteTime);
      }
      
      // Bird/Jungle atmosphere calls occasionally
      if (step % 32 === 0) {
        playTone(1200, 'sine', 0.2, 0.01, nextNoteTime);
        playTone(1400, 'sine', 0.2, 0.01, nextNoteTime + 0.1);
        playTone(1300, 'sine', 0.3, 0.01, nextNoteTime + 0.2);
      }

      nextNoteTime += 0.22; // Chill, moderate tempo
    }
    
    step++;
  }
  
  timeoutId = setTimeout(scheduleMusic, 25);
}

export function startMusic(level: number) {
  initAudio();
  if (!ctx) return;
  currentLevel = level;
  if (!isPlaying) {
    isPlaying = true;
    nextNoteTime = ctx.currentTime + 0.1;
    step = 0;
    scheduleMusic();
  }
}

export function stopMusic() {
  isPlaying = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

export function pauseMusic() {
  if (ctx && ctx.state === 'running') {
    ctx.suspend();
  }
}

export function resumeMusic() {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

export function playVictorySong() {
  initAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  // Triumphant C Major arpeggio (C4, E4, G4, C5, E5, G5, C6)
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
  const duration = 0.2;
  
  notes.forEach((freq, i) => {
    const isLast = i === notes.length - 1;
    const noteDuration = isLast ? 1.5 : duration; 
    const time = now + (i * duration);
    
    // Play main melody (bright tone)
    playTone(freq, 'square', noteDuration, 0.04, time);
    // Layer with a softer tone
    playTone(freq, 'triangle', noteDuration, 0.04, time);
  });
  
  // Big chord at the very end
  const endTime = now + ((notes.length - 1) * duration);
  playTone(523.25, 'sine', 1.5, 0.05, endTime); // C5
  playTone(659.25, 'sine', 1.5, 0.05, endTime); // E5
  playTone(783.99, 'sine', 1.5, 0.05, endTime); // G5
}
