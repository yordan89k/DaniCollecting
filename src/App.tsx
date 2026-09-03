/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import LevelScreen from './components/LevelScreen';
import VictoryScreen from './components/VictoryScreen';
import LevelClearedScreen from './components/LevelClearedScreen';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'level1' | 'level2' | 'level3' | 'level4' | 'cleared1' | 'cleared2' | 'cleared3' | 'victory'>('menu');

  const handleLevelComplete = () => {
    if (gameState === 'level1') setGameState('cleared1');
    else if (gameState === 'level2') setGameState('cleared2');
    else if (gameState === 'level3') setGameState('cleared3');
    else if (gameState === 'level4') setGameState('victory');
  };

  return (
    <div className="w-full h-full">
      {gameState === 'menu' && <MainMenu onStart={(level = 1) => setGameState(`level${level}` as any)} />}
      {gameState === 'level1' && <LevelScreen level={1} onComplete={handleLevelComplete} onQuit={() => setGameState('menu')} />}
      {gameState === 'level2' && <LevelScreen level={2} onComplete={handleLevelComplete} onQuit={() => setGameState('menu')} />}
      {gameState === 'level3' && <LevelScreen level={3} onComplete={handleLevelComplete} onQuit={() => setGameState('menu')} />}
      {gameState === 'level4' && <LevelScreen level={4} onComplete={handleLevelComplete} onQuit={() => setGameState('menu')} />}
      {gameState === 'cleared1' && <LevelClearedScreen level={1} onProceed={() => setGameState('level2')} />}
      {gameState === 'cleared2' && <LevelClearedScreen level={2} onProceed={() => setGameState('level3')} />}
      {gameState === 'cleared3' && <LevelClearedScreen level={3} onProceed={() => setGameState('level4')} />}
      {gameState === 'victory' && <VictoryScreen onRestart={() => setGameState('menu')} />}
    </div>
  );
}
