import { useEffect, useRef, useState } from "react";
import { initGame, updateGame, drawGame } from "./gameEngine";
import { GameState } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, Trophy } from "lucide-react";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const keysPressed = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => {
      const parent = canvasRef.current?.parentElement;
      if (parent) {
        setDimensions({
          width: parent.clientWidth,
          height: Math.min(600, window.innerHeight - 100),
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp") e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    let state = gameState || initGame();
    let animationFrameId: number;

    const loop = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      state = updateGame(state, keysPressed.current, dimensions.width, dimensions.height);
      drawGame(ctx, state, dimensions.width, dimensions.height);
      setGameState({ ...state });

      if (state.isGameOver) {
        setIsPlaying(false);
        return;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, dimensions]);

  const startGame = () => {
    setGameState(initGame());
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 uppercase">
          Jumpy Jace
        </h1>
        <p className="text-slate-400 mt-2 font-mono uppercase tracking-widest text-xs">
          Retro Platforming Action
        </p>
      </motion.div>

      <div className="relative w-full max-w-4xl aspect-video bg-[#1e293b] rounded-2xl border-4 border-[#334155] shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full block"
        />

        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-[#1e293b] p-8 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full"
              >
                {gameState && gameState.score > 0 ? (
                  <>
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                    <p className="text-slate-400 mb-6">You reached a score of {gameState.score}</p>
                    <button
                      onClick={startGame}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 group"
                    >
                      <RotateCcw className="group-hover:rotate-180 transition-transform duration-500" />
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-8">
                      <div className="w-20 h-20 bg-red-400 rounded-lg mx-auto mb-4 animate-bounce flex items-center justify-center">
                         <div className="w-4 h-4 bg-white rounded-sm translate-x-2 -translate-y-2" />
                      </div>
                      <h2 className="text-3xl font-bold mb-2">Ready to Jump?</h2>
                      <p className="text-slate-400">Use WASD or Arrow Keys to navigate Jace through the platforms.</p>
                    </div>
                    <button
                      onClick={startGame}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 group"
                    >
                      <Play className="fill-current" />
                      Start Game
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isPlaying && (
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Best</span>
                <span className="font-mono font-bold text-yellow-500">{gameState?.highScore || 0}</span>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <div className="flex flex-col leading-none items-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Score</span>
                <span className="font-mono font-bold">{gameState?.score || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Controls</h3>
          <p className="text-sm text-slate-300">WASD or Arrow Keys to move and jump. Spacebar also jumps.</p>
        </div>
        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Objective</h3>
          <p className="text-sm text-slate-300">Travel as far as possible to the right to increase your score.</p>
        </div>
        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pro Tip</h3>
          <p className="text-sm text-slate-300">Don't fall off the screen! The camera follows Jace's movement.</p>
        </div>
      </div>
    </div>
  );
}
