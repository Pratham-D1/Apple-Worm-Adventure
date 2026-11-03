// ==========================================
// Apple Worm Adventure - GameControls Component
// ==========================================

import React from 'react';
import { Button } from '../ui/Button';
import './game.css';

export const GameControls = ({
  onUndo,
  onHint,
  onTogglePause,
  onRestart,
  onToggleSound,
  isPaused = false,
  canUndo = false,
  isMuted = false
}) => {
  return (
    <div className="game-controls-bar" aria-label="Game Action Controls">
      <Button
        variant="outline"
        size="md"
        icon="↩️"
        onClick={onUndo}
        disabled={!canUndo || isPaused}
        title="Undo last move (or Ctrl+Z)"
      >
        Undo
      </Button>

      <Button
        variant="outline"
        size="md"
        icon="💡"
        onClick={onHint}
        disabled={isPaused}
        title="Get BFS optimal path hint"
      >
        Hint
      </Button>

      <Button
        variant="secondary"
        size="md"
        icon={isPaused ? '▶️' : '⏸️'}
        onClick={onTogglePause}
        title={isPaused ? 'Resume game (Space)' : 'Pause game (Space)'}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </Button>

      <Button
        variant="outline"
        size="md"
        icon="🔄"
        onClick={onRestart}
        title="Restart level to initial state (R)"
      >
        Restart
      </Button>

      <Button
        variant="ghost"
        size="md"
        icon={isMuted ? '🔇' : '🔊'}
        onClick={onToggleSound}
        title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      >
        {isMuted ? 'Muted' : 'Sound'}
      </Button>
    </div>
  );
};
