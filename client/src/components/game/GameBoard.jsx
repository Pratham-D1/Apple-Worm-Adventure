// ==========================================
// Apple Worm Adventure - GameBoard Component
// ==========================================

import React from 'react';
import { Button } from '../ui/Button';
import './game.css';

export const GameBoard = ({
  gridSize = { cols: 8, rows: 8 },
  worm = [{ x: 1, y: 4 }, { x: 1, y: 5 }],
  apples = [],
  obstacles = [],
  portal = { x: 6, y: 2 },
  facing = 'right',
  isPaused = false,
  isPortalUnlocked = false,
  status = 'playing',
  onRestart,
  onUndo
}) => {
  const { cols, rows } = gridSize;

  // Render cells in a 2D grid
  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isWormHead = worm[0] && worm[0].x === x && worm[0].y === y;
      const bodyIndex = worm.slice(1).findIndex((seg) => seg.x === x && seg.y === y);
      const isWormBody = bodyIndex >= 0;
      const isWormTail = isWormBody && bodyIndex === worm.length - 2;
      const isApple = apples.some((apple) => apple.x === x && apple.y === y);
      const isObstacle = obstacles.some((obs) => obs.x === x && obs.y === y);
      const isPortal = portal && portal.x === x && portal.y === y;

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`grid-cell ${
            (x + y) % 2 === 0 ? 'cell-even' : 'cell-odd'
          }`}
          data-x={x}
          data-y={y}
        >
          {/* Worm Head */}
          {isWormHead && (
            <div
              className={`cell-entity entity-worm-head entity-worm--${facing}`}
              title="Worm Head"
            >
              <div className="worm-eye eye-left"></div>
              <div className="worm-eye eye-right"></div>
            </div>
          )}

          {/* Worm Body & Tail */}
          {isWormBody && !isWormHead && (
            <div
              className={`cell-entity ${
                isWormTail ? 'entity-worm-tail' : 'entity-worm-body'
              }`}
              title={isWormTail ? 'Worm Tail' : 'Worm Body Segment'}
            ></div>
          )}

          {/* Apple */}
          {isApple && !isWormHead && (
            <div
              className="cell-entity entity-apple animate-bounce"
              title="Delicious Apple (Crunch to grow!)"
            >
              🍎
            </div>
          )}

          {/* Obstacle Block */}
          {isObstacle && (
            <div className="cell-entity entity-obstacle" title="Stone Obstacle">
              🧱
            </div>
          )}

          {/* Exit Portal */}
          {isPortal && (
            <div
              className={`cell-entity entity-portal ${
                isPortalUnlocked
                  ? 'portal--unlocked animate-spin-slow'
                  : 'portal--locked'
              }`}
              title={
                isPortalUnlocked
                  ? 'Portal OPEN! Slither in to finish!'
                  : 'Portal LOCKED! Collect all apples first.'
              }
            >
              <span className="portal-icon">🌀</span>
              {!isPortalUnlocked && <span className="portal-lock-badge">🔒</span>}
            </div>
          )}
        </div>
      );
    }
  }

  const isFailed = status === 'failed';

  return (
    <div className="board-wrapper">
      <div
        className={`game-board ${isPaused ? 'board--paused' : ''} ${
          isFailed ? 'board--failed' : ''
        }`}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
        aria-label="Apple Worm Adventure Puzzle Board"
      >
        {cells}

        {/* Paused Overlay */}
        {isPaused && (
          <div className="pause-overlay" role="dialog" aria-label="Game Paused">
            <span className="pause-icon animate-bounce">⏸️</span>
            <h3>Game Paused</h3>
            <p>Press Space or click Resume to continue</p>
          </div>
        )}

        {/* Failed / Out of Moves Overlay */}
        {isFailed && (
          <div className="failure-overlay" role="alert">
            <span className="failure-icon">😢</span>
            <h3>Out of Moves!</h3>
            <p>You used all allowed moves for this puzzle.</p>
            <div className="failure-actions">
              {onUndo && (
                <Button variant="gold" size="sm" icon="↩️" onClick={onUndo}>
                  Undo Move
                </Button>
              )}
              {onRestart && (
                <Button variant="primary" size="sm" icon="🔄" onClick={onRestart}>
                  Restart Level
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
