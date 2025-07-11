import React, { useState } from 'react';
import GridNumberGame from './GridNumberGame';      // Original maths game
import WordleGridGame from './WordleGridGame';      // New flexible game

function App() {
  const [currentGame, setCurrentGame] = useState('wordle');

  return (
    <div className="App">
      <div className="p-4 text-center bg-gray-100 border-b">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Educational Puzzle Games</h1>
        <p className="text-gray-600 mb-4">Co-created with Claude (Anthropic)</p>
        <div className="space-x-4">
          <button 
            onClick={() => setCurrentGame('numbers')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentGame === 'numbers' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
            }`}
          >
            📊 Numbers Game (Maths Focus)
          </button>
          <button 
            onClick={() => setCurrentGame('wordle')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentGame === 'wordle' 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
            }`}
          >
            🔤 Wordle Game (Letters/Numbers/Mixed)
          </button>
        </div>
      </div>
      
      {currentGame === 'numbers' ? <GridNumberGame /> : <WordleGridGame />}
    </div>
  );
}

export default App;
