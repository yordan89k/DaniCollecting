import React, { useEffect } from 'react';
import { Star } from 'lucide-react';
import { playVictorySong } from '../lib/audio';

export default function VictoryScreen({ onRestart }: { onRestart: () => void }) {
  useEffect(() => {
    playVictorySong();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-400 p-4 overflow-hidden">
      <div className="flex mb-8">
        <Star size={100} className="text-yellow-300 animate-spin fill-current drop-shadow-lg" />
        <Star size={120} className="text-yellow-300 animate-spin fill-current -mt-8 mx-4 drop-shadow-lg" style={{ animationDelay: '0.2s', animationDuration: '2s' }} />
        <Star size={100} className="text-yellow-300 animate-spin fill-current drop-shadow-lg" style={{ animationDelay: '0.4s' }} />
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-xl text-center mb-12">
        YOU WIN!
      </h1>
      
      <button 
        onClick={onRestart}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-4xl md:text-5xl py-6 px-16 rounded-full shadow-2xl transform transition hover:scale-110 active:scale-95 border-8 border-blue-700"
      >
        Play Again
      </button>
    </div>
  );
}
