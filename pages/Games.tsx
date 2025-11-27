
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Grid3X3, Trophy, ArrowLeft, RefreshCw, Box, Move, Hash, Circle, Square } from 'lucide-react';

type GameMode = 'menu' | 'tictactoe' | 'chess' | 'bird' | 'platformer' | 'probability';

// --- GAME MENU COMPONENT ---
export const Games: React.FC = () => {
    const [mode, setMode] = useState<GameMode>('menu');

    return (
        <div className="w-full h-full pt-24 px-4 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-end mb-8 border-b-2 border-white pb-6 gap-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Simulations</h1>
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Cognitive Training & Probability Engines</p>
                </div>
                {mode !== 'menu' && (
                    <button 
                        onClick={() => setMode('menu')}
                        className="flex items-center gap-2 border-2 border-white px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors text-xs tracking-widest"
                    >
                        <ArrowLeft size={16} /> Exit Sim
                    </button>
                )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-h-0 bg-black/20 border-4 border-white p-4 md:p-8 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {mode === 'menu' && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full overflow-y-auto hide-scrollbar"
                        >
                            <GameCard 
                                title="Tactical Grid" 
                                subtitle="Pattern Recognition" 
                                icon={<Grid3X3 size={32} />} 
                                onClick={() => setMode('tictactoe')} 
                            />
                            <GameCard 
                                title="Strategy Core" 
                                subtitle="Chess Engine" 
                                icon={<Box size={32} />} 
                                onClick={() => setMode('chess')} 
                            />
                            <GameCard 
                                title="Vector Bird" 
                                subtitle="Reflex Training" 
                                icon={<Move size={32} />} 
                                onClick={() => setMode('bird')} 
                            />
                            <GameCard 
                                title="Neon Runner" 
                                subtitle="Obstacle Traversal" 
                                icon={<Gamepad2 size={32} />} 
                                onClick={() => setMode('platformer')} 
                            />
                            <GameCard 
                                title="Probability" 
                                subtitle="RNG & Binary Decision" 
                                icon={<Hash size={32} />} 
                                onClick={() => setMode('probability')} 
                            />
                        </motion.div>
                    )}
                    {mode === 'tictactoe' && <TicTacToe />}
                    {mode === 'chess' && <ChessGame />}
                    {mode === 'bird' && <FlappyGame />}
                    {mode === 'platformer' && <PlatformGame />}
                    {mode === 'probability' && <ProbabilityEngine />}
                </AnimatePresence>
            </div>
        </div>
    );
};

const GameCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; onClick: () => void }> = ({ title, subtitle, icon, onClick }) => (
    <div 
        onClick={onClick}
        className="group border-2 border-white p-6 cursor-pointer hover:bg-white hover:text-blue-base transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 aspect-video"
    >
        <div className="p-4 border-2 border-white rounded-full group-hover:border-blue-base transition-colors">
            {icon}
        </div>
        <div>
            <div className="text-xl font-bold uppercase tracking-widest mb-1">{title}</div>
            <div className="text-xs font-mono opacity-60 uppercase">{subtitle}</div>
        </div>
    </div>
);

// --- TIC TAC TOE ---
const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);

    const checkWinner = (squares: (string | null)[]) => {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
        }
        return null;
    };

    const handleClick = (i: number) => {
        if (winner || board[i]) return;
        const newBoard = [...board];
        newBoard[i] = 'X';
        setBoard(newBoard);
        
        const win = checkWinner(newBoard);
        if (win) { setWinner(win); return; }
        if (!newBoard.includes(null)) { setWinner('DRAW'); return; }

        setIsXNext(false);
        setTimeout(() => makeComputerMove(newBoard), 500);
    };

    const makeComputerMove = (currentBoard: (string | null)[]) => {
        // Simple AI: Random empty spot
        const emptyIndices = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
        if (emptyIndices.length > 0) {
            const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            const newBoard = [...currentBoard];
            newBoard[randomIndex] = 'O';
            setBoard(newBoard);
            const win = checkWinner(newBoard);
            if (win) setWinner(win);
            else if (!newBoard.includes(null)) setWinner('DRAW');
            setIsXNext(true);
        }
    };

    const reset = () => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsXNext(true);
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center h-full">
            <div className="grid grid-cols-3 gap-2 mb-8">
                {board.map((cell, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleClick(i)}
                        disabled={!!cell || !!winner || !isXNext}
                        className="w-20 h-20 md:w-24 md:h-24 border-2 border-white flex items-center justify-center text-4xl font-bold uppercase hover:bg-white/10 disabled:hover:bg-transparent"
                    >
                        {cell}
                    </button>
                ))}
            </div>
            {winner && (
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold uppercase mb-2">
                        {winner === 'DRAW' ? 'System Stalemate' : `${winner === 'X' ? 'Operator' : 'System'} Victory`}
                    </div>
                    <button onClick={reset} className="border border-white px-6 py-2 uppercase font-bold hover:bg-white hover:text-black">Reset Grid</button>
                </div>
            )}
        </motion.div>
    );
};

// --- CHESS (Simplified) ---
// Note: Full chess engine is too large. This is a basic playable board with random AI for demonstration.
const initialBoard = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
];
const ChessGame: React.FC = () => {
    const [board, setBoard] = useState<string[][]>(initialBoard);
    const [selected, setSelected] = useState<{r:number, c:number} | null>(null);
    const [turn, setTurn] = useState<'white' | 'black'>('white');

    const isValidMove = (r1:number, c1:number, r2:number, c2:number, piece: string) => {
        // Simplified validation for demo purposes (Movement geometry only, ignoring sophisticated checks like pins/checks)
        const dr = r2 - r1;
        const dc = c2 - c1;
        const target = board[r2][c2];
        const isCapture = target !== '' && (piece === piece.toUpperCase() ? target === target.toLowerCase() : target === target.toUpperCase());
        const isEmpty = target === '';
        
        if (target !== '' && !isCapture) return false; // Can't eat own piece

        const type = piece.toLowerCase();
        
        if (type === 'p') {
            const dir = piece === 'P' ? -1 : 1;
            const startRow = piece === 'P' ? 6 : 1;
            if (c1 === c2 && isEmpty && r2 === r1 + dir) return true;
            if (c1 === c2 && isEmpty && r1 === startRow && r2 === r1 + (dir*2) && board[r1+dir][c1] === '') return true;
            if (Math.abs(c1 - c2) === 1 && r2 === r1 + dir && isCapture) return true;
            return false;
        }
        if (type === 'r') return (r1 === r2 || c1 === c2) && isPathClear(r1, c1, r2, c2);
        if (type === 'b') return Math.abs(dr) === Math.abs(dc) && isPathClear(r1, c1, r2, c2);
        if (type === 'q') return (r1 === r2 || c1 === c2 || Math.abs(dr) === Math.abs(dc)) && isPathClear(r1, c1, r2, c2);
        if (type === 'n') return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        if (type === 'k') return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;

        return false;
    };

    const isPathClear = (r1:number, c1:number, r2:number, c2:number) => {
        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);
        let r = r1 + dr;
        let c = c1 + dc;
        while (r !== r2 || c !== c2) {
            if (board[r][c] !== '') return false;
            r += dr;
            c += dc;
        }
        return true;
    };

    const handleSquareClick = (r: number, c: number) => {
        if (turn === 'black') return; // Wait for AI

        if (selected) {
            // Move
            if (selected.r === r && selected.c === c) { setSelected(null); return; }
            
            const piece = board[selected.r][selected.c];
            if (isValidMove(selected.r, selected.c, r, c, piece)) {
                const newBoard = board.map(row => [...row]);
                newBoard[r][c] = piece;
                newBoard[selected.r][selected.c] = '';
                setBoard(newBoard);
                setTurn('black');
                setSelected(null);
                setTimeout(() => makeAIMove(newBoard), 500);
            } else {
                 // Reselect if clicking own piece
                 if (board[r][c] !== '' && (board[r][c] === board[r][c].toUpperCase())) {
                     setSelected({r, c});
                 } else {
                     setSelected(null);
                 }
            }
        } else {
            if (board[r][c] !== '' && board[r][c] === board[r][c].toUpperCase()) {
                setSelected({r, c});
            }
        }
    };

    const makeAIMove = (currentBoard: string[][]) => {
        // Simple AI: Find all valid moves for black, pick random
        const moves: {r1:number, c1:number, r2:number, c2:number}[] = [];
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const p = currentBoard[r][c];
                if (p !== '' && p === p.toLowerCase()) {
                    for(let tr=0; tr<8; tr++) {
                        for(let tc=0; tc<8; tc++) {
                            if (isValidMove(r, c, tr, tc, p)) {
                                moves.push({r1:r, c1:c, r2:tr, c2:tc});
                            }
                        }
                    }
                }
            }
        }

        if (moves.length > 0) {
            // Prefer captures
            const captures = moves.filter(m => currentBoard[m.r2][m.c2] !== '');
            const move = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)];
            
            const newBoard = currentBoard.map(row => [...row]);
            newBoard[move.r2][move.c2] = newBoard[move.r1][move.c1];
            newBoard[move.r1][move.c1] = '';
            setBoard(newBoard);
            setTurn('white');
        }
    };

    const getPieceSymbol = (code: string) => {
        const map: {[key:string]:string} = {
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
            'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
        };
        return map[code] || '';
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center">
            <div className="mb-4 text-sm font-bold uppercase tracking-widest">{turn === 'white' ? 'Your Turn' : 'System Thinking...'}</div>
            <div className="border-4 border-white bg-white/10 p-1">
                {board.map((row, r) => (
                    <div key={r} className="flex">
                        {row.map((cell, c) => (
                            <div 
                                key={c}
                                onClick={() => handleSquareClick(r, c)}
                                className={`w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-2xl md:text-4xl cursor-pointer
                                    ${(r+c)%2===0 ? 'bg-white/10' : 'bg-transparent'}
                                    ${selected?.r === r && selected?.c === c ? 'bg-blue-500/50' : ''}
                                `}
                            >
                                <span className={cell === cell.toUpperCase() ? 'text-white' : 'text-black mix-blend-screen brightness-50'}>
                                    {getPieceSymbol(cell)}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <button onClick={() => { setBoard(initialBoard); setTurn('white'); }} className="mt-8 text-xs font-bold uppercase border border-white px-4 py-2 hover:bg-white hover:text-blue-base">Reset Board</button>
        </motion.div>
    );
};

// --- FLAPPY GAME ---
const FlappyGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);

    const bird = useRef({ y: 150, velocity: 0 });
    const pipes = useRef<{x: number, h: number}[]>([]);
    const frameRef = useRef<number>(0);

    const jump = () => {
        if (gameState === 'playing') {
            bird.current.velocity = -6;
        } else {
            startGame();
        }
    };

    const startGame = () => {
        bird.current = { y: 150, velocity: 0 };
        pipes.current = [{x: 400, h: 100}];
        setScore(0);
        setGameState('playing');
    };

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const loop = () => {
            if (gameState !== 'playing') return;

            // Physics
            bird.current.velocity += 0.4;
            bird.current.y += bird.current.velocity;

            // Pipes
            if (pipes.current[pipes.current.length-1].x < 250) {
                pipes.current.push({x: 400, h: 50 + Math.random() * 150});
            }
            pipes.current.forEach(p => p.x -= 2);
            pipes.current = pipes.current.filter(p => p.x > -50);

            // Collision
            const bx = 50, by = bird.current.y, bw = 20, bh = 20;
            if (by < 0 || by > 300) setGameState('gameover');
            
            pipes.current.forEach(p => {
                if (bx + bw > p.x && bx < p.x + 40) {
                    if (by < p.h || by + bh > p.h + 100) setGameState('gameover');
                }
                // Score
                if (Math.abs(p.x + 20 - bx) < 2) setScore(s => s + 1);
            });

            // Draw
            ctx.clearRect(0,0,400,300);
            
            // Bird
            ctx.fillStyle = '#FFF';
            ctx.fillRect(bx, by, bw, bh);

            // Pipes
            ctx.fillStyle = '#0047FF';
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            pipes.current.forEach(p => {
                ctx.strokeRect(p.x, 0, 40, p.h); // Top
                ctx.strokeRect(p.x, p.h + 100, 40, 300 - (p.h + 100)); // Bottom
            });

            frameRef.current = requestAnimationFrame(loop);
        };

        if (gameState === 'playing') loop();
        else {
            ctx.clearRect(0,0,400,300);
            ctx.fillStyle = '#FFF';
            ctx.font = '20px monospace';
            ctx.fillText(gameState === 'start' ? 'TAP TO START' : 'GAME OVER', 130, 150);
        }

        return () => cancelAnimationFrame(frameRef.current);
    }, [gameState]);

    return (
        <div className="flex flex-col items-center">
             <div className="mb-2 text-xl font-bold font-mono">SCORE: {score}</div>
             <canvas 
                ref={canvasRef} 
                width={400} height={300} 
                onClick={jump}
                className="border-4 border-white bg-black/40 cursor-pointer touch-none"
             />
             <div className="mt-4 text-xs opacity-50 uppercase tracking-widest">Tap / Click to Fly</div>
        </div>
    );
};

// --- PLATFORMER ---
const PlatformGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const player = useRef({ y: 200, dy: 0, grounded: true });
    const obstacles = useRef<{x: number, w: number, h: number}[]>([]);
    const frameRef = useRef<number>(0);
    const scoreRef = useRef(0);

    const jump = () => {
        if (gameState === 'playing') {
            if (player.current.grounded) {
                player.current.dy = -10;
                player.current.grounded = false;
            }
        } else {
            startGame();
        }
    };

    const startGame = () => {
        player.current = { y: 200, dy: 0, grounded: true };
        obstacles.current = [];
        scoreRef.current = 0;
        setGameState('playing');
    };

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const loop = () => {
            if (gameState !== 'playing') return;
            scoreRef.current++;

            // Physics
            player.current.dy += 0.5; // Gravity
            player.current.y += player.current.dy;
            
            if (player.current.y > 200) {
                player.current.y = 200;
                player.current.dy = 0;
                player.current.grounded = true;
            }

            // Obstacles
            if (scoreRef.current % 100 === 0 && Math.random() > 0.5) {
                obstacles.current.push({ x: 400, w: 20 + Math.random() * 30, h: 20 + Math.random() * 30 });
            }
            obstacles.current.forEach(o => o.x -= 4);
            obstacles.current = obstacles.current.filter(o => o.x > -50);

            // Collision
            const px = 50, py = player.current.y, pw = 20, ph = 20;
            obstacles.current.forEach(o => {
                if (px < o.x + o.w && px + pw > o.x && py < 220 && py + ph > 220 - o.h) {
                    setGameState('gameover');
                }
            });

            // Draw
            ctx.clearRect(0,0,400,250);
            
            // Ground
            ctx.strokeStyle = '#FFF';
            ctx.beginPath(); ctx.moveTo(0, 220); ctx.lineTo(400, 220); ctx.stroke();

            // Player
            ctx.fillStyle = '#FFF';
            ctx.fillRect(px, py, pw, ph);

            // Obstacles
            ctx.fillStyle = '#FF0000';
            obstacles.current.forEach(o => ctx.fillRect(o.x, 220 - o.h, o.w, o.h));

            // Score
            ctx.fillStyle = '#FFF';
            ctx.fillText(`DIST: ${Math.floor(scoreRef.current/10)}m`, 10, 20);

            frameRef.current = requestAnimationFrame(loop);
        };

        if (gameState === 'playing') loop();
        else {
            ctx.clearRect(0,0,400,250);
            ctx.fillStyle = '#FFF';
            ctx.font = '20px monospace';
            ctx.fillText(gameState === 'start' ? 'TAP TO RUN' : 'CRASHED', 140, 125);
        }

        return () => cancelAnimationFrame(frameRef.current);
    }, [gameState]);

    return (
        <div className="flex flex-col items-center">
            <canvas 
                ref={canvasRef} 
                width={400} height={250} 
                onClick={jump}
                className="border-4 border-white bg-black/40 cursor-pointer touch-none"
             />
             <div className="mt-4 text-xs opacity-50 uppercase tracking-widest">Tap to Jump</div>
        </div>
    );
};

// --- PROBABILITY ENGINE ---
const ProbabilityEngine: React.FC = () => {
    const [result, setResult] = useState<string>('READY');
    const [animating, setAnimating] = useState(false);

    const flipCoin = () => {
        setAnimating(true);
        setResult('FLIPPING...');
        setTimeout(() => {
            setResult(Math.random() > 0.5 ? 'HEADS' : 'TAILS');
            setAnimating(false);
        }, 800);
    };

    const rollDice = () => {
        setAnimating(true);
        setResult('ROLLING...');
        setTimeout(() => {
            setResult(Math.floor(Math.random() * 6 + 1).toString());
            setAnimating(false);
        }, 800);
    };

    const generateRandom = () => {
        setAnimating(true);
        setResult('COMPUTING...');
        setTimeout(() => {
            setResult(Math.floor(Math.random() * 100).toString());
            setAnimating(false);
        }, 600);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-12">
            <div className={`w-48 h-48 border-4 border-white flex items-center justify-center text-5xl font-bold font-mono transition-all ${animating ? 'animate-pulse bg-white text-blue-base' : 'bg-transparent text-white'}`}>
                {result}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
                <button onClick={flipCoin} className="border-2 border-white py-4 font-bold uppercase hover:bg-white hover:text-blue-base flex flex-col items-center gap-2">
                    <Circle size={24} /> Flip Coin
                </button>
                <button onClick={rollDice} className="border-2 border-white py-4 font-bold uppercase hover:bg-white hover:text-blue-base flex flex-col items-center gap-2">
                    <Square size={24} /> Roll D6
                </button>
                <button onClick={generateRandom} className="border-2 border-white py-4 font-bold uppercase hover:bg-white hover:text-blue-base flex flex-col items-center gap-2">
                    <Hash size={24} /> RNG 0-100
                </button>
            </div>
        </div>
    );
};
