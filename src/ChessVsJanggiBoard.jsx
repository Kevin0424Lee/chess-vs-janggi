import { useEffect, useRef, useState } from 'react';

const initialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(9).fill(null));
  // 체스 배치
  board[0][0] = { type: 'rook', team: 'chess', hp: 2 };
  board[0][1] = { type: 'knight', team: 'chess', hp: 1 };
  board[0][2] = { type: 'bishop', team: 'chess', hp: 1 };
  board[0][3] = { type: 'queen', team: 'chess', hp: 2 };
  board[0][4] = { type: 'king', team: 'chess', hp: 1 };
  board[1] = Array(9).fill(null).map(() => ({ type: 'pawn', team: 'chess', hp: 1 }));
  // 장기 배치
  board[7][0] = { type: 'cha', team: 'janggi', hp: 2 };
  board[7][1] = { type: 'ma', team: 'janggi', hp: 1 };
  board[7][2] = { type: 'sang', team: 'janggi', hp: 1 };
  board[7][3] = { type: 'sa', team: 'janggi', hp: 1 };
  board[7][4] = { type: 'wang', team: 'janggi', hp: 1 };
  board[6] = Array(9).fill(null).map(() => ({ type: 'byung', team: 'janggi', hp: 1 }));
  return board;
};

export default function ChessVsJanggiBoard() {
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState('chess');
  const [winner, setWinner] = useState(null);
  const [logs, setLogs] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const logRef = useRef(null);

  const logAction = (text) => {
    setLogs((prev) => [...prev.slice(-9), text]);
  };

  const playSound = (name) => {
    new Audio(`/sounds/${name}.mp3`).play();
  };

  const resetGame = () => {
    setBoard(initialBoard());
    setSelected(null);
    setTurn('chess');
    setWinner(null);
    setLogs([]);
    setAiThinking(false);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (turn === 'janggi' && !winner) {
      setAiThinking(true);
      setTimeout(() => {
        const allMoves = [];
        board.forEach((row, x) =>
          row.forEach((cell, y) => {
            if (cell && cell.team === 'janggi') {
              getValidMoves(x, y, cell).forEach(([nx, ny]) => {
                allMoves.push({ from: [x, y], to: [nx, ny] });
              });
            }
          })
        );
        if (allMoves.length > 0) {
          const move = allMoves[Math.floor(Math.random() * allMoves.length)];
          handleClick(move.from[0], move.from[1]);
          setTimeout(() => {
            handleClick(move.to[0], move.to[1]);
            setAiThinking(false);
          }, 300);
        } else {
          setAiThinking(false);
        }
      }, 600);
    }
  }, [turn]);

  const handleClick = (x, y) => {
    if (winner) return;
    const cell = board[x][y];
    if (selected) {
      const { x: sx, y: sy } = selected;
      const piece = board[sx][sy];
      const validMoves = getValidMoves(sx, sy, piece);
      const isValid = validMoves.some(([nx, ny]) => nx === x && ny === y);
      if (!isValid) {
        setSelected(null);
        return;
      }
      const newBoard = board.map((r) => r.slice());
      const target = newBoard[x][y];

      if (target && target.team !== piece.team) {
        playSound('attack');
        target.hp--;
        const action = target.hp <= 0 ? ' [KO]' : ' [Hit]';
        if (target.hp <= 0 && (target.type === 'king' || target.type === 'wang')) {
          setWinner(piece.team);
        }
        logAction(`${piece.team} ${renderPiece(piece)}→(${x},${y})${action}`);
        if (target.hp > 0) {
          setBoard(newBoard);
          setSelected(null);
          setTurn(turn === 'chess' ? 'janggi' : 'chess');
          return;
        }
        newBoard[x][y] = piece;
      } else {
        playSound('click');
        logAction(`${piece.team} ${renderPiece(piece)}→(${x},${y})`);
        newBoard[x][y] = piece;
      }
      newBoard[sx][sy] = null;
      setBoard(newBoard);
      setSelected(null);
      setTurn(turn === 'chess' ? 'janggi' : 'chess');
      if (winner) playSound('win');
    } else if (cell && cell.team === turn) {
      setSelected({ x, y });
    }
  };

  const getValidMoves = (x, y, piece) => {
    const moves = [];
    if (!piece) return moves;
    const addMove = (nx, ny) => {
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 9) {
        const t = board[nx][ny];
        if (!t || t.team !== piece.team) moves.push([nx, ny]);
      }
    };
    // ... (체스/장기 이동 로직 동일하게 구현)
    return moves;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">
        {winner
          ? `🎉 승자: ${winner}`
          : aiThinking
          ? '🤖 장기 (AI) 생각 중...'
          : `현재 턴: ${turn === 'chess' ? '♖ 체스 (플레이어)' : '王 장기 (AI)'}`}
      </h2>
      <div className="flex items-center gap-4 mb-2">
        <button onClick={resetGame} className="px-4 py-1 bg-red-500 text-white rounded">
          🔁 리셋
        </button>
        <span className="text-sm text-gray-600">
          왼쪽: ♖ 체스 (플레이어), 오른쪽: 王 장기 (AI)
        </span>
      </div>
      <div className="grid grid-cols-9 w-fit border-2">
        {board.map((row, i) =>
          row.map((cell, j) => {
            const isSelected = selected?.x === i && selected?.y === j;
            return (
              <div
                key={`${i}-${j}`}
                onClick={() => handleClick(i, j)}
                className={`w-16 h-16 flex flex-col items-center justify-center border text-xl cursor-pointer ${
                  isSelected ? 'bg-yellow-200' : 'bg-white'
                }`}
              >
                {cell ? (
                  <>
                    {renderPiece(cell)}
                    <span className="text-xs">{cell.hp}</span>
                  </>
                ) : (
                  ''
                )}
              </div>
            );
          })
        )}
      </div>
      <div ref={logRef} className="mt-4 text-sm bg-gray-100 p-2 h-32 overflow-y-auto">
        <strong>턴 로그</strong>
        <ul className="list-disc pl-4">
          {logs.map((log, idx) => (
            <li key={idx}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
);

function renderPiece(piece) {
  const symbols = {
    chess: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    janggi: { wang: '王', sa: '士', sang: '相', ma: '馬', cha: '車', po: '包', byung: '兵' },
  };
  return symbols[piece.team][piece.type] || '?';
}
EOF
