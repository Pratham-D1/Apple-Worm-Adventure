// ==========================================
// Apple Worm Adventure - Core Puzzle Game Engine
// ==========================================

import { findSmartHint } from './solver.js';
import { sounds } from './soundEffects.js';

export class GameEngine {
  constructor(levelConfig) {
    this.init(levelConfig);
  }

  /**
   * Initializes or resets the engine with a level configuration.
   */
  init(config) {
    if (!config) {
      throw new Error('Level configuration is required to initialize GameEngine');
    }

    this.levelId = config.id || 1;
    this.levelNumber = config.levelNumber || 1;
    this.title = config.title || `Level ${this.levelNumber}`;
    this.difficulty = config.difficulty || 'Easy';
    this.gridSize = {
      cols: config.gridSize?.cols || 8,
      rows: config.gridSize?.rows || 8
    };

    // Deep copy coordinates to prevent mutating original mock definitions
    const defaultWorm = [{ x: 1, y: 4 }, { x: 1, y: 5 }];
    this.worm = (config.startingPosition || defaultWorm).map(p => ({ ...p }));
    this.facing = config.initialFacing || 'right';

    const defaultApples = [{ x: 3, y: 4 }];
    this.apples = (config.apples || defaultApples).map(a => ({ ...a }));
    this.initialApplesCount = this.apples.length;

    this.obstacles = (config.obstacles || []).map(o => ({ ...o }));
    this.portal = config.portal ? { ...config.portal } : { x: 6, y: 2 };

    this.movesUsed = 0;
    this.maxMoves = config.maxMoves || 20;
    this.score = 0;
    this.status = 'ready'; // 'ready' | 'playing' | 'completed' | 'failed' | 'paused'
    this.stars = 0;
    this.feedback = null;

    // Undo History Stack
    this.history = [];
  }

  /**
   * Snapshot current state for Undo restoration.
   */
  createSnapshot() {
    return {
      worm: this.worm.map(p => ({ ...p })),
      facing: this.facing,
      apples: this.apples.map(a => ({ ...a })),
      movesUsed: this.movesUsed,
      score: this.score,
      status: this.status,
      stars: this.stars,
      feedback: this.feedback
    };
  }

  /**
   * Process a directional move ('up', 'down', 'left', 'right').
   */
  move(direction) {
    // 1. Check if game can accept moves
    if (this.status === 'completed' || this.status === 'failed' || this.status === 'paused') {
      return {
        success: false,
        reason: 'GAME_INACTIVE',
        status: this.status
      };
    }

    const head = this.worm[0];
    let newHead = { x: head.x, y: head.y };

    if (direction === 'up') newHead.y -= 1;
    else if (direction === 'down') newHead.y += 1;
    else if (direction === 'left') newHead.x -= 1;
    else if (direction === 'right') newHead.x += 1;
    else {
      return { success: false, reason: 'INVALID_DIRECTION' };
    }

    // 2. Prevent 180° neck reversal if worm length > 1
    if (this.worm.length > 1) {
      const neck = this.worm[1];
      if (newHead.x === neck.x && newHead.y === neck.y) {
        sounds.playBlocked();
        this.feedback = { type: 'blocked', message: "Cannot reverse directly into your own neck!" };
        return { success: false, reason: 'REVERSAL_BLOCKED' };
      }
    }

    // 3. Grid Boundary Collision
    if (
      newHead.x < 0 ||
      newHead.x >= this.gridSize.cols ||
      newHead.y < 0 ||
      newHead.y >= this.gridSize.rows
    ) {
      sounds.playBlocked();
      this.feedback = { type: 'blocked', message: "Reached the garden boundary!" };
      return { success: false, reason: 'OUT_OF_BOUNDS' };
    }

    // 4. Obstacle Collision
    const hitObstacle = this.obstacles.some(
      obs => obs.x === newHead.x && obs.y === newHead.y
    );
    if (hitObstacle) {
      sounds.playBlocked();
      this.feedback = { type: 'blocked', message: "Blocked by a stone obstacle!" };
      return { success: false, reason: 'HIT_OBSTACLE' };
    }

    // 5. Apple Detection
    const appleIndex = this.apples.findIndex(
      a => a.x === newHead.x && a.y === newHead.y
    );
    const isEatingApple = appleIndex >= 0;

    // 6. Self-Collision Check
    // If not eating an apple, tail vacates on this step; moving into tail is legal!
    // If eating an apple, tail does not vacate (worm grows), so tail cell remains occupied.
    const segmentsToCheck = isEatingApple
      ? this.worm.slice(1) // Entire body including tail
      : this.worm.slice(1, -1); // Body excluding the vacating tail

    const hitSelf = segmentsToCheck.some(
      seg => seg.x === newHead.x && seg.y === newHead.y
    );
    if (hitSelf) {
      sounds.playBlocked();
      this.feedback = { type: 'blocked', message: "Ouch! You bumped into your own body!" };
      return { success: false, reason: 'HIT_SELF' };
    }

    // 7. Push current state to undo history before applying movement
    this.history.push(this.createSnapshot());

    // 8. Apply Movement & Growth
    this.facing = direction;
    this.status = 'playing';
    this.movesUsed += 1;

    let appleCollected = false;
    if (isEatingApple) {
      // Collect apple
      this.apples.splice(appleIndex, 1);
      // Worm grows: new head + all previous segments
      this.worm = [newHead, ...this.worm];
      this.score += 200;
      appleCollected = true;
      sounds.playAppleEat();
      this.feedback = {
        type: 'apple',
        message: `Crunch! +200 points! (${this.apples.length} apple${this.apples.length === 1 ? '' : 's'} remaining)`
      };
    } else {
      // Normal slither: new head + previous segments excluding old tail
      this.worm = [newHead, ...this.worm.slice(0, this.worm.length - 1)];
      sounds.playMove();
      this.feedback = null;
    }

    // 9. Portal & Level Completion Validation
    let levelCompleted = false;
    if (newHead.x === this.portal.x && newHead.y === this.portal.y) {
      if (this.apples.length > 0) {
        // Portal locked because apples remain
        sounds.playPortalLocked();
        this.feedback = {
          type: 'portal-locked',
          message: `The portal is locked! Collect the remaining ${this.apples.length} apple${this.apples.length === 1 ? '' : 's'} first! 🍎`
        };
      } else {
        // All apples collected and stepped on portal: VICTORY!
        levelCompleted = true;
        this.status = 'completed';

        // Calculate score & star formulas
        const efficiencyBonus = Math.max(0, (this.maxMoves - this.movesUsed) * 25);
        this.score = this.score + 500 + efficiencyBonus;

        // Star rating thresholds
        const threeStarThreshold = Math.ceil(this.maxMoves * 0.65);
        const twoStarThreshold = Math.ceil(this.maxMoves * 0.85);

        if (this.movesUsed <= threeStarThreshold) {
          this.stars = 3;
        } else if (this.movesUsed <= twoStarThreshold) {
          this.stars = 2;
        } else {
          this.stars = 1;
        }

        sounds.playVictory();
        this.feedback = {
          type: 'victory',
          message: `Victory! Level ${this.levelNumber} cleared with ${this.stars} stars!`
        };
      }
    }

    // 10. Move Limit & Failure Check
    let levelFailed = false;
    if (!levelCompleted && this.maxMoves > 0 && this.movesUsed >= this.maxMoves) {
      this.status = 'failed';
      levelFailed = true;
      sounds.playFailure();
      this.feedback = {
        type: 'failed',
        message: `Out of moves! You used all ${this.maxMoves} moves. Undo or Restart to try again!`
      };
    }

    return {
      success: true,
      appleCollected,
      levelCompleted,
      levelFailed,
      movesUsed: this.movesUsed,
      remainingMoves: Math.max(0, this.maxMoves - this.movesUsed),
      score: this.score,
      stars: this.stars,
      state: this.getState()
    };
  }

  /**
   * Undo to the previous valid game state.
   */
  undo() {
    if (this.history.length === 0) {
      return false;
    }

    const previousState = this.history.pop();
    this.worm = previousState.worm;
    this.facing = previousState.facing;
    this.apples = previousState.apples;
    this.movesUsed = previousState.movesUsed;
    this.score = previousState.score;
    this.status = previousState.status;
    this.stars = previousState.stars;
    this.feedback = { type: 'undo', message: 'Move undone!' };

    sounds.playUndo();
    return true;
  }

  /**
   * Restart the level to its pristine starting configuration.
   */
  restart() {
    // Keep reference to initial config
    this.init({
      id: this.levelId,
      levelNumber: this.levelNumber,
      title: this.title,
      difficulty: this.difficulty,
      gridSize: this.gridSize,
      startingPosition: this.worm,
      initialFacing: 'right',
      apples: this.apples,
      obstacles: this.obstacles,
      portal: this.portal,
      maxMoves: this.maxMoves
    });
    this.history = [];
    this.feedback = { type: 'info', message: 'Level restarted!' };
  }

  /**
   * Pause and Resume
   */
  togglePause() {
    if (this.status === 'completed' || this.status === 'failed') return;
    this.status = this.status === 'paused' ? 'playing' : 'paused';
    return this.status === 'paused';
  }

  /**
   * Get an intelligent hint toward the next goal.
   */
  getHint() {
    return findSmartHint(this.getState());
  }

  /**
   * Return exportable state for React renderer.
   */
  getState() {
    return {
      levelId: this.levelId,
      levelNumber: this.levelNumber,
      title: this.title,
      difficulty: this.difficulty,
      gridSize: this.gridSize,
      worm: this.worm.map(p => ({ ...p })),
      facing: this.facing,
      apples: this.apples.map(a => ({ ...a })),
      initialApplesCount: this.initialApplesCount,
      obstacles: this.obstacles.map(o => ({ ...o })),
      portal: { ...this.portal },
      movesUsed: this.movesUsed,
      maxMoves: this.maxMoves,
      remainingMoves: Math.max(0, this.maxMoves - this.movesUsed),
      score: this.score,
      status: this.status,
      stars: this.stars,
      feedback: this.feedback,
      canUndo: this.history.length > 0,
      isPortalUnlocked: this.apples.length === 0
    };
  }
}
