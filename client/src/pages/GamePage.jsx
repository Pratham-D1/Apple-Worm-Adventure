// ==========================================
// Apple Worm Adventure - Game Screen (Retro Arcade Edition)
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useGameEngine } from '../gameEngine/useGameEngine';
import { ArcadeCabinet } from '../components/game/ArcadeCabinet';
import { GameBoard } from '../components/game/GameBoard';
import { LevelCompleteModal } from '../components/game/LevelCompleteModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import './pages.css';

export const GamePage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const {
    levels,
    completeLevel,
    recordFailedSession,
    user,
    doubleReward,
    lastRewardDetails
  } = useGame();

  // Validate level ID
  const parsedLevelId = parseInt(levelId, 10);
  const isValidId = !isNaN(parsedLevelId) && parsedLevelId >= 1 && parsedLevelId <= levels.length;
  const levelData = isValidId ? levels.find((l) => l.id === parsedLevelId) : null;

  // Find next playable unlocked level for redirection helpers
  const nextPlayableLevel = levels.find((l) => l.isUnlocked && !l.isCompleted) || levels[0];

  // Initialize pure puzzle engine via custom hook (passing valid levelData or null)
  const {
    state,
    move,
    undo,
    restart,
    togglePause,
    requestHint,
    hintInfo,
    isMuted,
    toggleSound
  } = useGameEngine(levelData);

  const [hasStarted, setHasStarted] = useState(false);
  const [victoryModalOpen, setVictoryModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeReward, setActiveReward] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const completedRef = useRef(false);
  const failedRef = useRef(false);

  // Reset attract mode when level changes
  useEffect(() => {
    setHasStarted(false);
  }, [parsedLevelId]);

  // Keyboard listener to dismiss start overlay on any valid game key
  useEffect(() => {
    const handleKey = (e) => {
      const targetTag = e.target?.tagName?.toUpperCase();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter'].includes(e.code)) {
        setHasStarted(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Sync completion and failures with GameContext and persistent MongoDB Atlas sessions
  useEffect(() => {
    if (state?.status === 'completed' && !completedRef.current && levelData) {
      completedRef.current = true;
      completeLevel(levelData.id, state.score, state.stars, state.movesUsed).then((res) => {
        if (res) {
          setActiveSessionId(res.sessionId);
          setActiveReward(res.earnedCoins);
          if (res.newlyUnlockedAchievements && res.newlyUnlockedAchievements.length > 0) {
            setUnlockedAchievements(res.newlyUnlockedAchievements);
          }
        }
      });
      setVictoryModalOpen(true);
    } else if (state?.status === 'failed' && !failedRef.current && levelData) {
      failedRef.current = true;
      recordFailedSession(levelData.id, state.score, state.movesUsed);
    } else if (state?.status !== 'completed' && state?.status !== 'failed') {
      completedRef.current = false;
      failedRef.current = false;
    }
  }, [state?.status, state?.score, state?.stars, state?.movesUsed, levelData, completeLevel, recordFailedSession]);

  // Guard 1: Nonexistent Level ID Validation
  if (!isValidId || !levelData) {
    return (
      <div className="game-guard-container">
        <Card className="game-guard-card">
          <span className="guard-icon">🔍</span>
          <h2 className="pixel-text text-neon-coral">LEVEL NOT FOUND</h2>
          <p>
            Sector <strong>"{levelId}"</strong> does not exist in Apple Worm Adventure.
            The arcade cabinet contains <strong>{levels.length}</strong> distinct puzzle sectors.
          </p>
          <div className="guard-actions">
            <Button variant="secondary" size="md" icon="🗺️" onClick={() => navigate('/levels')}>
              BROWSE ALL {levels.length} SECTORS
            </Button>
            <Button variant="outline" size="md" icon="🏡" onClick={() => navigate('/')}>
              MAIN MENU
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Guard 2: Locked Level Navigation Guard
  if (!levelData.isUnlocked) {
    return (
      <div className="game-guard-container">
        <Card className="game-guard-card">
          <span className="guard-icon animate-bounce">🔒</span>
          <h2 className="pixel-text text-neon-amber">SECTOR #{levelData.levelNumber} LOCKED</h2>
          <p>
            You haven't unlocked <strong>{levelData.title}</strong> ({levelData.worldName}) yet.
            Complete <strong>Sector #{levelData.levelNumber - 1}</strong> first to gain entry code!
          </p>
          <div className="guard-actions">
            <Button
              variant="secondary"
              size="md"
              icon="▶️"
              onClick={() => navigate(`/game/${nextPlayableLevel.id}`)}
            >
              PLAY SECTOR #{nextPlayableLevel.levelNumber}
            </Button>
            <Button variant="outline" size="md" icon="🗺️" onClick={() => navigate('/levels')}>
              SELECT SECTOR
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="game-loading pixel-text text-neon-green animate-pulse">
        INITIALIZING CRT ORCHARD SECTOR...
      </div>
    );
  }

  const applesRemaining = state.apples.length;
  const applesCollected = state.initialApplesCount - applesRemaining;
  const isPaused = state.status === 'paused';
  const highScore = Math.max(levelData.highScore || 0, state.score || 0);

  return (
    <div className="game-page-container">
      {/* Retro Arcade Cabinet */}
      <ArcadeCabinet
        levelNumber={state.levelNumber}
        levelTitle={state.title}
        difficulty={state.difficulty}
        score={state.score}
        highScore={highScore}
        movesUsed={state.movesUsed}
        maxMoves={state.maxMoves}
        applesCollected={applesCollected}
        totalApples={state.initialApplesCount}
        walletBalance={user.walletBalance || 0}
        isPaused={isPaused}
        isMuted={isMuted}
        canUndo={state.canUndo && !isPaused && state.status !== 'completed'}
        hasStarted={hasStarted || state.movesUsed > 0}
        status={state.status}
        hintInfo={hintInfo}
        feedback={state.feedback}
        onStartGame={() => setHasStarted(true)}
        onUndo={undo}
        onHint={requestHint}
        onTogglePause={togglePause}
        onRestart={() => {
          setHasStarted(false);
          restart();
        }}
        onToggleSound={toggleSound}
        onMove={(direction) => {
          setHasStarted(true);
          move(direction);
        }}
        onNavigateLevels={() => navigate('/levels')}
      >
        <GameBoard
          gridSize={state.gridSize}
          worm={state.worm}
          apples={state.apples}
          obstacles={state.obstacles}
          portal={state.portal}
          facing={state.facing}
          isPaused={isPaused}
          isPortalUnlocked={state.isPortalUnlocked}
          status={state.status}
          onRestart={() => {
            setHasStarted(false);
            restart();
          }}
          onUndo={undo}
        />
      </ArcadeCabinet>

      {/* Control Instructions & Rules Card */}
      <Card className="game-instructions-card">
        <div className="instructions-columns">
          <div>
            <strong className="text-neon-cyan">⌨️ ARCADE CONTROLS:</strong>
            <p>
              Use <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> Arrow keys or{' '}
              <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to slither.{' '}
              <kbd>Space</kbd>: Pause &bull; <kbd>Ctrl+Z</kbd>: Undo &bull; <kbd>R</kbd>: Restart.
            </p>
          </div>
          <div>
            <strong className="text-neon-amber">🎯 OBJECTIVE:</strong>
            <p>
              Eat every Apple (🍎) to activate the dimensional portal (🌀) before depleting moves.
              Slithering into the space just vacated by your tail is safe!
            </p>
          </div>
        </div>
      </Card>

      {/* Victory Level Completion Modal */}
      <LevelCompleteModal
        isOpen={victoryModalOpen}
        onClose={() => setVictoryModalOpen(false)}
        levelNumber={state.levelNumber}
        score={state.score}
        stars={state.stars}
        movesUsed={state.movesUsed}
        coinsEarned={activeReward || lastRewardDetails?.coinsAwarded || (50 + state.stars * 10)}
        sessionId={activeSessionId || lastRewardDetails?.sessionId}
        canDouble={lastRewardDetails?.canDouble ?? true}
        onDoubleReward={doubleReward}
        newlyUnlockedAchievements={unlockedAchievements}
        onNextLevel={() => {
          setVictoryModalOpen(false);
          setActiveSessionId(null);
          setActiveReward(null);
          setUnlockedAchievements([]);
          const nextLvl = levels.find((l) => l.id === parsedLevelId + 1);
          if (nextLvl) {
            navigate(`/game/${nextLvl.id}`);
          } else {
            navigate('/levels');
          }
        }}
        onReplay={() => {
          setVictoryModalOpen(false);
          setActiveSessionId(null);
          setActiveReward(null);
          setUnlockedAchievements([]);
          setHasStarted(false);
          restart();
        }}
        onLevelSelect={() => {
          setVictoryModalOpen(false);
          setActiveSessionId(null);
          setActiveReward(null);
          setUnlockedAchievements([]);
          navigate('/levels');
        }}
      />
    </div>
  );
};
