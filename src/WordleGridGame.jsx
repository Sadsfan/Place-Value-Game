import React, { useState } from 'react';

const WordleGridGame = () => {
  const [numColumns, setNumColumns] = useState(5);
  const [maxRows, setMaxRows] = useState(6);
  const [gameMode, setGameMode] = useState('letters');
  
  const [grid, setGrid] = useState(() => {
    const headers = ['1st', '2nd', '3rd', '4th', '5th'];
    return Array(2).fill(null).map((_, rowIndex) => 
      Array(5).fill(null).map((_, colIndex) => 
        rowIndex === 0 ? headers[colIndex] : { content: null, symbol: null }
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

  const generateHeaders = (columns) => {
    const headers = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    return headers.slice(0, columns);
  };

  const generatePalette = () => {
    switch (gameMode) {
      case 'numbers':
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 'letters':
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      case 'mixed':
        return [...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
      default:
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    }
  };

  const resetGrid = (columns = numColumns) => {
    const headers = generateHeaders(columns);
    const newGrid = Array(2).fill(null).map((_, rowIndex) => 
      Array(columns).fill(null).map((_, colIndex) => 
        rowIndex === 0 ? headers[colIndex] : { content: null, symbol: null }
      )
    );
    setGrid(newGrid);
  };

  const validateAnswer = (input) => {
    if (input.length !== numColumns) return false;
    
    switch (gameMode) {
      case 'numbers':
        return /^[0-9]+$/.test(input);
      case 'letters':
        return /^[A-Za-z]+$/.test(input);
      case 'mixed':
        return /^[A-Za-z0-9]+$/.test(input);
      default:
        return false;
    }
  };

  const parseAnswer = (input) => {
    switch (gameMode) {
      case 'numbers':
        return input.split('').map(Number);
      case 'letters':
      case 'mixed':
        return input.toUpperCase().split('');
      default:
        return input.toUpperCase().split('');
    }
  };

  const isRowComplete = (row) => {
    return row.every(cell => cell && cell.content !== null);
  };

  // FIXED: Auto-populate only after checking answer
  const autoPopulateCorrectContent = (newGrid) => {
    let lastRowIndex = -1;
    for (let i = newGrid.length - 1; i >= 1; i--) {
      const row = newGrid[i];
      if (row.some(cell => cell && cell.symbol !== null)) {
        lastRowIndex = i;
        break;
      }
    }
    
    if (lastRowIndex === -1) return newGrid;
    
    const lastCheckedRow = newGrid[lastRowIndex];
    if (isRowComplete(lastCheckedRow) && newGrid.length < maxRows) {
      const newRow = Array(numColumns).fill(null).map(() => ({ content: null, symbol: null }));
      newGrid.push(newRow);
      
      const newRowIndex = newGrid.length - 1;
      
      for (let colIndex = 0; colIndex < numColumns; colIndex++) {
        const cell = lastCheckedRow[colIndex];
        if (cell && cell.symbol === '✓' && cell.content !== null) {
          newGrid[newRowIndex][colIndex].content = cell.content;
        }
      }
    }
    
    return newGrid;
  };

  const handleSetAnswer = () => {
    if (validateAnswer(answerInput)) {
      setCorrectAnswer(parseAnswer(answerInput));
      setHasCorrectAnswer(true);
      setShowAnswerInput(false);
      setAnswerInput('');
    } else {
      let errorMsg = `Please enter exactly ${numColumns}`;
      switch (gameMode) {
        case 'numbers':
          errorMsg += ' digits (0-9)';
          break;
        case 'letters':
          errorMsg += ' letters (A-Z)';
          break;
        case 'mixed':
          errorMsg += ' characters (letters and numbers)';
          break;
      }
      setWarningMessage(errorMsg);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  const revealNextSymbol = () => {
    if (currentSymbolIndex >= pendingSymbols.length) return;

    const symbolData = pendingSymbols[currentSymbolIndex];
    const newGrid = [...grid];
    newGrid[symbolData.rowIndex][symbolData.colIndex].symbol = symbolData.symbol;
    setGrid(newGrid);

    const nextIndex = currentSymbolIndex + 1;
    setCurrentSymbolIndex(nextIndex);

    if (nextIndex >= pendingSymbols.length) {
      const correctCount = pendingSymbols.filter(s => s.isCorrect).length;
      
      if (correctCount === numColumns) {
        setTimeout(() => {
          setWinnerRow(symbolData.rowIndex);
          setShowCelebration(true);
          
          setTimeout(() => {
            setShowCelebration(false);
            setWinnerRow(null);
          }, 3000);
        }, 500);
      }
      
      setTimeout(() => {
        const updatedGrid = autoPopulateCorrectContent([...newGrid]);
        setGrid(updatedGrid);
        setPendingSymbols([]);
        setCurrentSymbolIndex(0);
      }, 1000);
    }
  };

  const checkAnswer = () => {
    if (!hasCorrectAnswer) {
      setWarningMessage('Please set the correct answer first!');
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    let targetRowIndex = -1;
    for (let i = grid.length - 1; i >= 1; i--) {
      const row = grid[i];
      if (row.some(cell => cell && cell.content !== null)) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      setWarningMessage('Please enter some content first!');
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    const targetRow = grid[targetRowIndex];
    const symbols = [];

    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      const cell = targetRow[colIndex];
      if (cell && cell.content !== null) {
        const guessedContent = cell.content;
        const correctContent = correctAnswer[colIndex];

        if (guessedContent === correctContent) {
          symbols.push({ rowIndex: targetRowIndex, colIndex, symbol: '✓', isCorrect: true });
        } else if (correctAnswer.includes(guessedContent)) {
          symbols.push({ rowIndex: targetRowIndex, colIndex, symbol: '○', isCorrect: false });
        } else {
          symbols.push({ rowIndex: targetRowIndex, colIndex, symbol: '✗', isCorrect: false });
        }
      }
    }

    setPendingSymbols(symbols);
    setCurrentSymbolIndex(0);
  };

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

  // FIXED: Removed automatic row addition on drop
  const dropItem = (rowIndex, colIndex) => {
    if (draggedItem.type === 'content') {
      const newGrid = [...grid];
      if (newGrid[rowIndex][colIndex] === null) {
        newGrid[rowIndex][colIndex] = { content: null, symbol: null };
      }
      newGrid[rowIndex][colIndex].content = draggedItem.value;
      setGrid(newGrid);
      
    } else if (draggedItem.type === 'symbol') {
      const newGrid = [...grid];
      if (newGrid[rowIndex][colIndex] === null) {
        newGrid[rowIndex][colIndex] = { content: null, symbol: null };
      }
      newGrid[rowIndex][colIndex].symbol = draggedItem.value;
      setGrid(newGrid);
    }
  };

  const clearCell = (rowIndex, colIndex) => {
    if (rowIndex === 0) return;
    
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = { content: null, symbol: null };
    setGrid(newGrid);
  };

  const clearGrid = () => {
    resetGrid();
    setWinnerRow(null);
    setShowCelebration(false);
    setPendingSymbols([]);
    setCurrentSymbolIndex(0);
  };

  const palette = generatePalette();

  return (
    <div className="p-4 h-screen max-w-full mx-auto relative flex flex-col">
      {showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⚠️</span>
            <span className="font-bold text-lg">{warningMessage}</span>
          </div>
        </div>
      )}

      {showAnswerInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Set Correct Answer</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the {numColumns}-character correct answer:
            </p>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value.slice(0, numColumns).toUpperCase())}
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-wider mb-4"
              placeholder="HAPPY"
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

      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl font-bold text-yellow-400 animate-bounce drop-shadow-lg">
            🎉 WINNER! 🎉
          </div>
        </div>
      )}

      {isDragging && draggedItem && (
        <div
          className="fixed pointer-events-none z-40 w-12 h-12 bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center shadow-lg"
          style={{
            left: dragPosition.x - 24,
            top: dragPosition.y - 24,
          }}
        >
          {draggedItem.value}
        </div>
      )}
      
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-56 flex flex-col">
          <h1 className="text-xl font-bold text-center mb-4">Puzzle Game</h1>
          
          <div className="space-y-1 text-xs text-gray-600 mb-4">
            <p>• Drag letters into the grid</p>
            <p>• Teacher sets correct answer first</p>
            <p>• Click "Check Answer" to see results</p>
            <p>• ✓ = correct position</p>
            <p>• ○ = correct but wrong position</p>
            <p>• ✗ = not in answer</p>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowAnswerInput(true)}
              className={`px-4 py-3 ${hasCorrectAnswer ? 'bg-emerald-500' : 'bg-orange-500'} text-white rounded-lg text-sm font-semibold w-full`}
            >
              {hasCorrectAnswer ? '✓ Answer Set' : 'Set Answer'}
            </button>
            <button 
              onClick={checkAnswer}
              className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold w-full"
            >
              Check Answer
            </button>
            {pendingSymbols.length > 0 && currentSymbolIndex < pendingSymbols.length && (
              <button 
                onClick={revealNextSymbol}
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold w-full animate-pulse"
              >
                Reveal Next ({currentSymbolIndex + 1}/{pendingSymbols.length})
              </button>
            )}
            <button 
              onClick={clearGrid}
              className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold w-full"
            >
              Clear Grid
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-end justify-center pb-8">
          <div className="inline-block border-2 border-gray-300 rounded-lg overflow-hidden">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className={`flex ${winnerRow === rowIndex ? 'bg-yellow-200' : ''}`}>
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
                    }`}
                    style={{ width: '88px', height: '88px' }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                    onClick={() => clearCell(rowIndex, colIndex)}
                  >
                    {rowIndex === 0 ? (
                      <span className="text-lg font-black text-gray-800">
                        {cell}
                      </span>
                    ) : (
                      <>
                        {cell && cell.content !== null && (
                          <span className="text-3xl font-bold text-blue-600">
                            {cell.content}
                          </span>
                        )}
                        {cell && cell.symbol !== null && (
                          <span className="absolute top-0 right-0 text-sm font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center border">
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

        <div className="w-64 flex flex-col">
          <div className="flex-1"></div>
          
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2">Drag Letters:</h2>
            <div className="grid gap-1 grid-cols-4 max-h-64 overflow-y-auto">
              {palette.map((item, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'content', value: item })}
                  onTouchStart={(e) => handleTouchStart(e, { type: 'content', value: item })}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab text-sm"
                >
                  {item}
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
                className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab text-lg"
              >
                ✓
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'symbol', value: '✗' })}
                onTouchStart={(e) => handleTouchStart(e, { type: 'symbol', value: '✗' })}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab text-lg"
              >
                ✗
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'symbol', value: '○' })}
                onTouchStart={(e) => handleTouchStart(e, { type: 'symbol', value: '○' })}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center cursor-grab text-lg"
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

export default WordleGridGame;
