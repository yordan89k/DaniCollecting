import React, { useEffect } from 'react';
import { Star } from 'lucide-react';
import { stopMusic } from '../lib/audio';

export default function LevelClearedScreen({ level, onProceed }: { level: number, onProceed: () => void }) {
  useEffect(() => {
    // Optionally stop music or play a win sound here
    stopMusic(); 
    
    const timer = setTimeout(() => {
      onProceed();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onProceed]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-500 p-4 overflow-hidden">
      <div className="animate-bounce flex flex-col items-center">
        <Star size={100} className="text-yellow-300 fill-yellow-300 mb-8 drop-shadow-2xl" />
        <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-xl text-center transform -rotate-2">
          Level {level} Cleared!
        </h1>
        <p className="text-3xl text-white mt-8 font-bold opacity-90 animate-pulse bg-black/20 px-8 py-3 rounded-full">
          Get Ready...
        </p>
      </div>
    </div>
  );
}
