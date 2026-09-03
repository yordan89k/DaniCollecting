import React, { useEffect, useState } from 'react';
import { initAudio, startMusic, stopMusic } from '../lib/audio';
import { Rocket, Car, Waves, Trees, Music, Volume2, VolumeX } from 'lucide-react';

export default function MainMenu({ onStart }: { onStart: (level?: number) => void }) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isMuted) {
      startMusic(0);
    } else {
      stopMusic();
    }
  }, [isMuted]);

  useEffect(() => {
    return () => stopMusic();
  }, []);

  const handleStart = (level: number) => {
    initAudio();
    // No need to call startMusic(0) here because LevelScreen will call startMusic(level)
    onStart(level);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sky-400 p-4 overflow-hidden" onClick={() => { if (!isMuted) startMusic(0); }}>
      <button
        onClick={toggleMute}
        className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 p-4 rounded-full text-white backdrop-blur-sm transition-all shadow-lg"
      >
        {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
      </button>

      <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-xl text-center mb-12 transform -rotate-2">
        <span className="text-yellow-300">Dani</span><br/>collecting
      </h1>
      
      <button 
        onClick={(e) => { e.stopPropagation(); handleStart(1); }}
        className="bg-red-500 hover:bg-red-600 text-white font-bold text-5xl md:text-6xl py-6 px-16 rounded-full shadow-2xl transform transition hover:scale-110 active:scale-95 border-8 border-red-700"
      >
        PLAY
      </button>
      
      <div className="flex gap-8 mt-12 mb-8 text-white opacity-90">
        <Rocket size={60} className="animate-bounce drop-shadow-md" />
        <Car size={60} className="animate-bounce drop-shadow-md" style={{ animationDelay: '0.2s' }} />
        <Waves size={60} className="animate-bounce drop-shadow-md" style={{ animationDelay: '0.4s' }} />
        <Trees size={60} className="animate-bounce drop-shadow-md" style={{ animationDelay: '0.6s' }} />
      </div>

      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
        <button 
          onClick={(e) => { e.stopPropagation(); handleStart(1); }} 
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-lg border-4 border-purple-700 transform transition hover:scale-110 active:scale-95 flex flex-col items-center"
        >
          <span>Level 1</span>
          <span className="text-sm opacity-80">Space</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleStart(2); }} 
          className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-lg border-4 border-green-700 transform transition hover:scale-110 active:scale-95 flex flex-col items-center"
        >
          <span>Level 2</span>
          <span className="text-sm opacity-80">Drive</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleStart(3); }} 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-lg border-4 border-blue-700 transform transition hover:scale-110 active:scale-95 flex flex-col items-center"
        >
          <span>Level 3</span>
          <span className="text-sm opacity-80">Ocean</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleStart(4); }} 
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-lg border-4 border-amber-800 transform transition hover:scale-110 active:scale-95 flex flex-col items-center"
        >
          <span>Level 4</span>
          <span className="text-sm opacity-80">Jungle</span>
        </button>
      </div>
    </div>
  );
}
