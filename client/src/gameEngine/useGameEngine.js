// ==========================================
// Apple Worm Adventure - useGameEngine Hook
// ==========================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './GameEngine.js';
import { sounds } from './soundEffects.js';

export function useGameEngine(levelConfig) {
  // Store the engine instance in a ref so it persists across renders without recreation
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [hintInfo, setHintInfo] = useState(null);

  // Initialize or re-initialize engine when levelConfig changes
  useEffect(() => {
    if (!levelConfig) return;
    const engine = new GameEngine(levelConfig);
    engineRef.current = engine;
    setGameState(engine.getState());
    setHintInfo(null);
  }, [levelConfig?.id, levelConfig?.levelNumber]);

  // Movement action wrapper
  const move = useCallback((direction) => {
    if (!engineRef.current) return;
    const result = engineRef.current.move(direction);
    setGameState(engineRef.current.getState());
    setHintInfo(null); // Clear hint once player takes an action
    return result;
  }, []);

  // Undo action wrapper
  const undo = useCallback(() => {
    if (!engineRef.current) return;
    const success = engineRef.current.undo();
    if (success) {
      setGameState(engineRef.current.getState());
      setHintInfo(null);
    }
    return success;
  }, []);

  // Restart action wrapper
  const restart = useCallback(() => {
    if (!engineRef.current || !levelConfig) return;
    const engine = new GameEngine(levelConfig);
    engineRef.current = engine;
    setGameState(engine.getState());
    setHintInfo(null);
  }, [levelConfig]);

  // Pause / Resume toggle
  const togglePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.togglePause();
    setGameState(engineRef.current.getState());
  }, []);

  // Request a hint
  const requestHint = useCallback(() => {
    if (!engineRef.current) return;
    const hint = engineRef.current.getHint();
    setHintInfo(hint);
    return hint;
  }, []);

  // Audio mute toggle
  const toggleSound = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  }, []);

  // Setup Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Ignore if user is currently typing in an input or textarea
      const targetTag = e.target?.tagName?.toUpperCase();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }

      // 2. Prevent key repeat from flooding rapid inputs
      if (e.repeat) {
        return;
      }

      // 3. Directional movement
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        move('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        move('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        move('right');
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        restart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, undo, restart, togglePause]);

  return {
    state: gameState,
    move,
    undo,
    restart,
    togglePause,
    requestHint,
    hintInfo,
    isMuted,
    toggleSound
  };
}
