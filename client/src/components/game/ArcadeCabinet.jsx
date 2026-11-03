// ==========================================
// Apple Worm Adventure - Retro Arcade Cabinet Frame
// ==========================================

import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GameDPad } from './GameDPad';
import './game.css';

export const ArcadeCabinet = ({
  levelNumber = 1,
  levelTitle = 'First Steps',
  difficulty = 'Easy',
  score = 0,
  highScore = 0,
  movesUsed = 0,
  maxMoves = 20,
  applesCollected = 0,
  totalApples = 1,
  walletBalance = 0,
  isPaused = false,
  isMuted = false,
  canUndo = false,
  hasStarted = true,
  status = 'playing',
  hintInfo = null,
  feedback = null,
  onStartGame,
  onUndo,
  onHint,
  onTogglePause,
  onRestart,
  onToggleSound,
  onMove,
  onNavigateLevels,
  children
}) => {
  const remainingMoves = Math.max(0, maxMoves - movesUsed);
  const isCappedWarning = remainingMoves <= 3 && maxMoves > 0;

  return (
    <div className="arcade-cabinet-wrapper">
      {/* Outer Metallic Arcade Cabinet */}
      <div className="arcade-cabinet">
        {/* Top Cabinet Marquee */}
        <div className="arcade-marquee">
          <div className="cabinet-bolt bolt-tl"></div>
          <div className="cabinet-marquee-content">
            <span className="marquee-logo animate-pulse">🍎</span>
            <div className="marquee-text-group">
              <span className="marquee-title pixel-text">APPLE WORM</span>
              <span className="marquee-sub">ARCADE EDITION &bull; 1986</span>
            </div>
            <span className="marquee-logo animate-pulse">🐛</span>
          </div>

          <div className="cabinet-status-leds">
            <div className="led-indicator" title="1 Player Active">
              <span className="led-bulb led-green animate-led"></span>
              <span className="led-label">1P</span>
            </div>
            <div className="led-indicator" title="CRT Screen Synced">
              <span className="led-bulb led-cyan"></span>
              <span className="led-label">CRT</span>
            </div>
            <div className="led-indicator" title="Game Engine Online">
              <span className="led-bulb led-amber"></span>
              <span className="led-label">SYNC</span>
            </div>
          </div>
          <div className="cabinet-bolt bolt-tr"></div>
        </div>

        {/* Outer Bezel */}
        <div className="arcade-bezel">
          {/* Inner Curved CRT Screen Housing */}
          <div className="arcade-screen-housing">
            {/* Top HUD inside CRT Screen */}
            <div className="crt-hud-top">
              {/* Left HUD: Score & High Score */}
              <div className="hud-col hud-left">
                <div className="hud-label-pixel">SCORE</div>
                <div className="hud-value-digital text-neon-green">{score.toString().padStart(5, '0')}</div>
                <div className="hud-sub-val">HIGH: {highScore.toString().padStart(5, '0')}</div>
              </div>

              {/* Center HUD: Level Title & Badge */}
              <div className="hud-col hud-center">
                <div className="hud-level-pill">
                  <span className="hud-level-num pixel-text">STAGE {levelNumber.toString().padStart(2, '0')}</span>
                  <span className="hud-level-title">{levelTitle}</span>
                </div>
                <span className="hud-diff-tag">{difficulty}</span>
              </div>

              {/* Right HUD: Moves & Apples */}
              <div className="hud-col hud-right">
                <div className="hud-label-pixel">MOVES LEFT</div>
                <div className={`hud-value-digital ${isCappedWarning ? 'text-neon-coral animate-bounce' : 'text-neon-amber'}`}>
                  {remainingMoves.toString().padStart(2, '0')}
                  <span className="hud-max-moves"> / {maxMoves}</span>
                </div>
                <div className="hud-apples-pill">
                  🍎 {applesCollected}/{totalApples} APPLES
                </div>
              </div>
            </div>

            {/* CRT Screen Display Area (Contains GameBoard & Start Overlay) */}
            <div className="crt-viewport">
              {/* Scanline CRT overlay */}
              <div className="crt-scanlines-layer" aria-hidden="true"></div>

              {/* Dynamic Hint / Feedback Banner inside CRT */}
              {hintInfo && (
                <div className="crt-alert-banner crt-hint animate-bounce">
                  <span>💡 {hintInfo.message}</span>
                </div>
              )}
              {feedback && !hintInfo && (
                <div className={`crt-alert-banner crt-${feedback.type}`}>
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Actual Game Board rendered inside */}
              {children}

              {/* Retro Start Overlay (shown before first move) */}
              {!hasStarted && status !== 'completed' && status !== 'failed' && (
                <div className="crt-start-overlay">
                  <div className="start-content animate-pulse">
                    <span className="start-icon">🍎🐛</span>
                    <h2 className="start-title pixel-text">APPLE WORM</h2>
                    <p className="start-level-label">LEVEL {levelNumber}: {levelTitle}</p>

                    <Button
                      variant="secondary"
                      size="lg"
                      className="start-game-btn"
                      onClick={onStartGame}
                    >
                      ▶ PRESS START / SLITHER
                    </Button>

                    <div className="start-instructions">
                      <span>⌨️ USE ARROW KEYS OR W-A-S-D TO MOVE</span>
                      <span>SPACE: PAUSE &bull; Z: UNDO &bull; R: RESTART</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom CRT Status Ticker */}
            <div className="crt-hud-bottom">
              <div className="ticker-left">
                <span className="ticker-status-tag">STATUS: {status.toUpperCase()}</span>
                <span className="ticker-separator">&bull;</span>
                <span className="ticker-coin-val">🟡 {walletBalance} COINS</span>
              </div>
              <div className="ticker-right">
                <span>VELOOP ARCADE &bull; 60 FPS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arcade Control Deck (Physical push buttons) */}
        <div className="arcade-control-deck">
          <div className="deck-buttons-group">
            <button
              type="button"
              className="arcade-push-btn btn-cyan"
              onClick={onUndo}
              disabled={!canUndo || isPaused || status === 'completed'}
              title="Undo Move (Ctrl+Z)"
            >
              <span className="btn-cap">↩ UNDO</span>
            </button>

            <button
              type="button"
              className="arcade-push-btn btn-amber"
              onClick={onHint}
              disabled={isPaused || status === 'completed'}
              title="BFS Path Hint"
            >
              <span className="btn-cap">💡 HINT</span>
            </button>

            <button
              type="button"
              className="arcade-push-btn btn-green"
              onClick={onTogglePause}
              title="Pause/Resume (Space)"
            >
              <span className="btn-cap">{isPaused ? '▶ RESUME' : '⏸ PAUSE'}</span>
            </button>

            <button
              type="button"
              className="arcade-push-btn btn-coral"
              onClick={onRestart}
              title="Restart Level (R)"
            >
              <span className="btn-cap">🔄 RESTART</span>
            </button>

            <button
              type="button"
              className="arcade-push-btn btn-dark"
              onClick={onToggleSound}
              title="Audio Sound Toggle"
            >
              <span className="btn-cap">{isMuted ? '🔇 MUTED' : '🔊 SOUND'}</span>
            </button>
          </div>

          {/* Touch D-Pad for Mobile & Tablet */}
          <div className="deck-dpad-wrapper">
            <GameDPad onMove={onMove} disabled={isPaused || status === 'failed' || status === 'completed'} />
          </div>
        </div>

        {/* Cabinet Base Footer Bar */}
        <div className="arcade-cabinet-footer">
          <div className="cabinet-bolt bolt-bl"></div>
          <div className="cabinet-footer-actions">
            <Button size="sm" variant="outline" onClick={onNavigateLevels}>
              🗺️ All 50 Levels
            </Button>
            <span className="cabinet-serial">CABINET NO. AWA-1986-ATLAS</span>
          </div>
          <div className="cabinet-bolt bolt-br"></div>
        </div>
      </div>
    </div>
  );
};

