// ==========================================
// Apple Worm Adventure - GameDPad (Mobile Touch Controls)
// ==========================================

import React from 'react';
import './game.css';

export const GameDPad = ({ onMove, disabled = false }) => {
  return (
    <div className="mobile-dpad-container" aria-label="Mobile directional touch pad">
      <div className="dpad-grid">
        <div className="dpad-spacer"></div>
        <button
          type="button"
          className="dpad-btn dpad-up"
          onClick={() => onMove('up')}
          disabled={disabled}
          aria-label="Move Up"
        >
          ▲
        </button>
        <div className="dpad-spacer"></div>

        <button
          type="button"
          className="dpad-btn dpad-left"
          onClick={() => onMove('left')}
          disabled={disabled}
          aria-label="Move Left"
        >
          ◀
        </button>
        <div className="dpad-center-hub">
          <span className="hub-worm">🐛</span>
        </div>
        <button
          type="button"
          className="dpad-btn dpad-right"
          onClick={() => onMove('right')}
          disabled={disabled}
          aria-label="Move Right"
        >
          ▶
        </button>

        <div className="dpad-spacer"></div>
        <button
          type="button"
          className="dpad-btn dpad-down"
          onClick={() => onMove('down')}
          disabled={disabled}
          aria-label="Move Down"
        >
          ▼
        </button>
        <div className="dpad-spacer"></div>
      </div>
      <span className="dpad-hint">Touch D-Pad or use Arrow Keys / WASD</span>
    </div>
  );
};

