// GridNumberGame.jsx
// Co-created with Claude (Anthropic)

import React, { useState } from 'react';

const GridNumberGame = () => {
  // Game configuration state
  const [numColumns, setNumColumns] = useState(7);
  const [maxRows, setMaxRows] = useState(8);
  
  // Game state
  const [grid, setGrid] = useState(() => {
    const headers = ['M', 'hth', 'tth', 'th', 'h', 't', 'o'];
    return Array(2).fill(null).map((_, rowIndex) => 
      Array(7).fill(null).map((_, colIndex) => 
        rowIndex === 0 ? headers[colIndex] : { number: null, symbol: null }
      )
    );
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const [winnerRow, setWinnerRow] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState([]);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [hasCorrectAnswer, setHasCorrectAnswer] = useState(false);
  const [pendingSymbols, setPendingSymbols] = useState([]);
  const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);

  // Generate headers based on column count
  const generateHeaders = (columns) => {
    const defaultHeaders = ['M', 'hth', 'tth', 'th', 'h', 't', 'o', 'tth', 'hth', 'M'];
    return defaultHeaders.slice(0, columns);
  };

  // Reset grid with new dimensions
  const resetGrid = (columns = numColumns) => {
    const headers = generateHeaders(columns);
    const newGrid = Array(2).fill(null).map((_, rowIndex) => 
      Array(columns).fill(null).map((_, colIndex) => 
        rowIndex === 0 ? headers[colIndex] : { number: null, symbol: null }
      )
    );
    setGrid(newGrid);
  };

  // Apply grid settings
  const applyGridSettings = (newColumns, newMaxRows) => {
    if (newColumns >= 3 && newColumns <= 10 && newMaxRows >= 3 && newMaxRows <= 12) {
      setNumColumns(newColumns);
      setMaxRows(newMaxRows);
      setHasCorrectAnswer(false);
      setCorrectAnswer([]);
      setPendingSymbols([]);
      setCurrentSymbolIndex(0);
      resetGrid(newColumns);
      setShowSettingsModal(false);
    } else {
      setWarningMessage('Invalid settings. Columns: 3-10, Rows: 3-12');
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  // Create sound effects using Web Audio API
  const playDingSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  const playVictorySound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * 0.15);
        gainNode.gain.setValueAtTime(0.4, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  // Check if a row is completely filled (all cells have numbers)
  const isRowComplete = (row) => {
    return row.every(cell => cell && cell.number !== null);
  };

  // Add a new row if the current bottom row is complete
  const checkAndAddNewRow = (newGrid) => {
    const lastRowIndex = newGrid.length - 1;
    const lastRow = newGrid[lastRowIndex];
    
    if (isRowComplete(lastRow) && newGrid.length < maxRows) {
      const newRow = Array(numColumns).fill(null).map(() => ({ number: null, symbol: null }));
      newGrid.push(newRow);
    }
    
    return newGrid;
  };

  // Auto-populate correct numbers in new row
  const autoPopulateCorrectNumbers = (newGrid) => {
    // Find the last completed row with symbols
    let lastRowIndex = -1;
    for (let i = newGrid.length - 1; i >= 1; i--) {
      const row = newGrid[i];
      if (row.some(cell => cell && cell.symbol !== null)) {
        lastRowIndex = i;
        break;
      }
    }
    
    if (lastRowIndex === -1) return newGrid;
    
    // Create new row if needed and copy correct numbers
    if (newGrid.length < maxRows) {
      const newRow = Array(numColumns).fill(null).map(() => ({ number: null, symbol: null }));
      newGrid.push(newRow);
      
      // Copy correct numbers (those with ✓) to new row
      const lastRow = newGrid[lastRowIndex];
      const newRowIndex = newGrid.length - 1;
      
      for (let colIndex = 0; colIndex < numColumns; colIndex++) {
        const cell = lastRow[colIndex];
        if (cell && cell.symbol === '✓' && cell.number !== null) {
          newGrid[newRowIndex][colIndex].number = cell.number;
        }
      }
    }
    
    return newGrid;
  };

  // Check for winning row (all ticks)
  const checkForWinner = (newGrid) => {
    for (let rowIndex = 1; rowIndex < newGrid.length; rowIndex++) {
      const row = newGrid[rowIndex];
      const hasAllNumbers = row.every(cell => cell && cell.number !== null);
      const hasAllTicks = row.every(cell => cell && cell.symbol === '✓');
      
      if (hasAllNumbers && hasAllTicks) {
        setWinnerRow(rowIndex);
        setShowCelebration(true);
        playVictorySound();
        
        setTimeout(() => {
          setShowCelebration(false);
          setWinnerRow(null);
        }, 3000);
        
        return true;
      }
    }
    return false;
  };

  // Handle setting the correct answer
  const handleSetAnswer = () => {
    if (answerInput.length === numColumns && /^[0-9]+$/.test(answerInput)) {
      setCorrectAnswer(answerInput.split('').map(Number));
      setHasCorrectAnswer(true);
      setShowAnswerInput(false);
      setAnswerInput('');
    } else {
      setWarningMessage(`Please enter exactly ${numColumns} digits (0-9)`);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  // Reveal next symbol
  const revealNextSymbol = () => {
    if (currentSymbolIndex >= pendingSymbols.length) return;

    const symbolData = pendingSymbols[currentSymbolIndex];
    const newGrid = [...grid];
    newGrid[symbolData.rowIndex][symbolData.colIndex].symbol = symbolData.symbol;
    setGrid(newGrid);

    if (symbolData.isCorrect) {
      playDingSound();
    }

    const nextIndex = currentSymbolIndex + 1;
    setCurrentSymbolIndex(nextIndex);

    // Check if we're done
    if (nextIndex >= pendingSymbols.length) {
      const correctCount = pendingSymbols.filter(s => s.isCorrect).length;
      
      if (correctCount === numColumns) {
        setTimeout(() => {
          setWinnerRow(symbolData.rowIndex);
          setShowCelebration(true);
          playVictorySound();
          
          setTimeout(() => {
            setShowCelebration(false);
            setWinnerRow(null);
          }, 3000);
        }, 500);
      }
      
      // Auto-populate correct numbers and clear pending symbols
      setTimeout(() => {
        const updatedGrid = autoPopulateCorrectNumbers([...newGrid]);
        setGrid(updatedGrid);
        setPendingSymbols([]);
        setCurrentSymbolIndex(0);
      }, 1000);
    }
  };

  // Check numbers against correct answer
  const checkNumbers = () => {
    if (!hasCorrectAnswer) {
      setWarningMessage('Please set the correct answer first!');
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    if (pendingSymbols.length > 0) {
      setWarningMessage('Wait for current reveal to finish!');
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    // Find the last row with numbers
    let targetRowIndex = -1;
    for (let i = grid.length - 1; i >= 1; i--) {
      const row = grid[i];
      if (row.some(cell => cell && cell.number !== null)) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      setWarningMessage('Please enter some numbers first!');
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    const targetRow = grid[targetRowIndex];
    const symbols = [];

    // Prepare all symbols
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      const cell = targetRow[colIndex];
      if (cell && cell.number !== null) {
        const guessedNumber = cell.number;
        const correctNumber = correctAnswer[colIndex];

        if (guessedNumber === correctNumber) {
          symbols.push({ rowIndex: targetRowIndex, colIndex, symbol: '✓', isCorrect: true });
        } else if (correctAnswer.includes(guessedNumber)) {
          symbols.push({ rowIndex: targetRowIndex, colIndex, symbol: '○', isCorrect: false });
        } else {
          symbols.push({ rowIndex: targetRowIndex, colIndex, symbol: '✗', isCorrect: false });
        }
      }
    }

    setPendingSymbols(symbols);
    setCurrentSymbolIndex(0);
  };

  // Touch and drag handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTouchStart = (e, item) => {
    e.preventDefault();
    setDraggedItem(item);
    setIsDragging(true);
    
    const touch = e.touches[0];
    setDragPosition({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    setDragPosition({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleTouchEnd = (e) => {
    if (!isDragging || !draggedItem) {
      setIsDragging(false);
      setDraggedItem(null);
      setDragPosition({ x: 0, y: 0 });
      return;
    }
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    let targetElement = elementBelow;
    let attempts = 0;
    while (targetElement && !targetElement.dataset.row && attempts < 10) {
      targetElement = targetElement.parentElement;
      attempts++;
    }
    
    if (targetElement && targetElement.dataset.row && targetElement.dataset.col) {
      const rowIndex = parseInt(targetElement.dataset.row);
      const colIndex = parseInt(targetElement.dataset.col);
      
      if (rowIndex > 0) {
        dropItem(rowIndex, colIndex);
      }
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setDragPosition({ x: 0, y: 0 });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, rowIndex, colIndex) => {
    e.preventDefault();
    
    if (rowIndex === 0) return;
    
    if (draggedItem !== null) {
      dropItem(rowIndex, colIndex);
      setDraggedItem(null);
    }
  };

  // Drop item logic
  const dropItem = (rowIndex, colIndex) => {
    if (draggedItem.type === 'number') {
      // Check duplicates
      const currentRow = grid[rowIndex];
      for (let i = 0; i < currentRow.length; i++) {
        if (i !== colIndex && currentRow[i] && currentRow[i].number === draggedItem.value) {
          setWarningMessage(`Number ${draggedItem.value} is already used in this row!`);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
          return;
        }
      }
      
      let newGrid = [...grid];
      if (newGrid[rowIndex][colIndex] === null) {
        newGrid[rowIndex][colIndex] = { number: null, symbol: null };
      }
      newGrid[rowIndex][colIndex].number = draggedItem.value;
      newGrid = checkAndAddNewRow(newGrid);
      setGrid(newGrid);
      checkForWinner(newGrid);
      
    } else if (draggedItem.type === 'symbol') {
      const newGrid = [...grid];
      if (newGrid[rowIndex][colIndex] === null) {
        newGrid[rowIndex][colIndex] = { number: null, symbol: null };
      }
      newGrid[rowIndex][colIndex].symbol = draggedItem.value;
      setGrid(newGrid);
      checkForWinner(newGrid);
    }
  };

  // Clear functions
  const clearCell = (rowIndex, colIndex) => {
    if (rowIndex === 0) return;
    
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = { number: null, symbol: null };
    setGrid(newGrid);
  };

  const clearNumbers = () => {
    resetGrid();
  };

  const clearSymbols = () => {
    const newGrid = grid.map((row, rowIndex) => 
      rowIndex === 0 ? row : row.map(cell => ({ ...cell, symbol: null }))
    );
    setGrid(newGrid);
  };

  const clearGrid = () => {
    resetGrid();
    setWinnerRow(null);
    setShowCelebration(false);
    setPendingSymbols([]);
    setCurrentSymbolIndex(0);
  };

  return (
    <div className="p-4 h-screen max-w-full mx-auto relative flex flex-col">
      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl border-2 border-red-600">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⚠️</span>
            <span className="font-bold text-lg">{warningMessage}</span>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Grid Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Columns (3-10):</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  defaultValue={numColumns}
                  className="w-full p-2 border border-gray-300 rounded"
                  id="columnsInput"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Rows (3-12):</label>
                <input
                  type="number"
                  min="3"
                  max="12"
                  defaultValue={maxRows}
                  className="w-full p-2 border border-gray-300 rounded"
                  id="maxRowsInput"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  const newColumns = parseInt(document.getElementById('columnsInput').value);
                  const newMaxRows = parseInt(document.getElementById('maxRowsInput').value);
                  applyGridSettings(newColumns, newMaxRows);
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Apply Settings
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answer input modal */}
      {showAnswerInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Set Correct Answer</h2>
            <p className="text-sm text-gray-600 mb-4">Enter the {numColumns}-digit correct answer (numbers 0-9):</p>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value.slice(0, numColumns))}
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-wider mb-4"
              placeholder={'1'.repeat(numColumns)}
              maxLength={numColumns}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSetAnswer}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Set Answer
              </button>
              <button
                onClick={() => {setShowAnswerInput(false); setAnswerInput('');}}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl font-bold text-yellow-400 animate-bounce drop-shadow-lg">
            🎉 WINNER! 🎉
          </div>
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-gradient-to-r from-red-400 to-yellow-400 animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Touch drag preview */}
      {isDragging && draggedItem && (
        <div
          className="fixed pointer-events-none z-40 w-12 h-12 bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center shadow-lg"
          style={{
            left: dragPosition.x - 24,
            top: dragPosition.y - 24,
            backgroundColor: draggedItem.type === 'symbol' ? 
              (draggedItem.value === '✓' ? '#10b981' : 
               draggedItem.value === '✗' ? '#ef4444' : '#8b5cf6') : '#3b82f6'
          }}
        >
          {draggedItem.value}
        </div>
      )}
      
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-56 flex flex-col">
          <h1 className="text-xl font-bold text-center mb-4">Grid Number Game</h1>
          
          <div className="space-y-1 text-xs text-gray-600 mb-4">
            <p>• Drag numbers into the grid</p>
            <p>• Teacher sets correct answer first</p>
            <p>• Click "Check Numbers" to see results</p>
            <p>• ✓ = correct, ○ = wrong place, ✗ = not in answer</p>
            <p>• Correct numbers (✓) auto-fill in new rows</p>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 w-full shadow-lg"
            >
              Grid Settings
            </button>
            <button 
              onClick={() => setShowAnswerInput(true)}
              className={`px-4 py-3 ${hasCorrectAnswer ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-lg text-sm font-semibold transition-colors duration-200 w-full shadow-lg`}
            >
              {hasCorrectAnswer ? '✓ Answer Set' : 'Set Answer'}
            </button>
            <button 
              onClick={checkNumbers}
              className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 w-full shadow-lg"
            >
              Check Numbers
            </button>
            {pendingSymbols.length > 0 && currentSymbolIndex < pendingSymbols.length && (
              <button 
                onClick={revealNextSymbol}
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 w-full shadow-lg animate-pulse"
              >
                Reveal Next ({currentSymbolIndex + 1}/{pendingSymbols.length})
              </button>
            )}
            <button 
              onClick={clearNumbers}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 w-full shadow-lg"
            >
              Clear Numbers
            </button>
            <button 
              onClick={clearSymbols}
              className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 w-full shadow-lg"
            >
              Clear Symbols
            </button>
            <button 
              onClick={clearGrid}
              className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 w-full shadow-lg"
            >
              Clear Everything
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex items-end justify-center pb-8">
          <div className="inline-block border-2 border-gray-300 rounded-lg overflow-hidden">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className={`flex ${winnerRow === rowIndex ? 'bg-yellow-200 animate-pulse' : ''}`}>
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-row={rowIndex}
                    data-col={colIndex}
                    className={`border border-gray-300 flex items-center justify-center font-medium relative ${
                      rowIndex === 0 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-white hover:bg-gray-50'
                    } ${
                      rowIndex > 0 ? 'cursor-pointer' : ''
                    } ${
                      winnerRow === rowIndex ? 'border-yellow-400 border-2' : ''
                    } ${
                      rowIndex === grid.length - 1 && rowIndex > 0 ? 'ring-2 ring-blue-300' : ''
                    }`}
                    style={{ width: '88px', height: '88px' }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                    onClick={() => clearCell(rowIndex, colIndex)}
                    title={rowIndex > 0 ? "Click to clear cell" : ""}
                  >
                    {rowIndex === 0 ? (
                      <span className="text-2xl font-black text-gray-800" style={{fontSize: '28px'}}>
                        {cell}
                      </span>
                    ) : (
                      <>
                        {cell && cell.number !== null && (
                          <span className="text-3xl font-bold text-blue-600">
                            {cell.number}
                          </span>
                        )}
                        {cell && cell.symbol !== null && (
                          <span className="absolute top-0 right-0 text-sm font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center border border-gray-300">
                            {cell.symbol}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 flex flex-col">
          <div className="flex-1"></div>
          
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2">Drag Numbers:</h2>
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <div
                  key={number}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'number', value: number })}
                  onTouchStart={(e) => handleTouchStart(e, { type: 'number', value: number })}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-colors duration-200 touch-none select-none"
                >
                  {number}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-2">Drag Symbols:</h2>
            <div className="flex gap-1">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'symbol', value: '✓' })}
                onTouchStart={(e) => handleTouchStart(e, { type: 'symbol', value: '✓' })}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-colors duration-200 text-lg touch-none select-none"
              >
                ✓
              </div>
              <div
                draggable
                onTouchStart={(e) => handleTouchStart(e, { type: 'symbol', value: '✗' })}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDragStart={(e) => handleDragStart(e, { type: 'symbol', value: '✗' })}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-colors duration-200 text-lg touch-none select-none"
              >
                ✗
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'symbol', value: '○' })}
                onTouchStart={(e) => handleTouchStart(e, { type: 'symbol', value: '○' })}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-colors duration-200 text-lg touch-none select-none"
              >
                ○
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridNumberGame;
