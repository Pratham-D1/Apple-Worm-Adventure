// ==========================================
// Apple Worm Adventure - BFS Hint Solver
// ==========================================

const DIRECTIONS = [
  { name: 'up', dx: 0, dy: -1, symbol: '⬆️' },
  { name: 'down', dx: 0, dy: 1, symbol: '⬇️' },
  { name: 'left', dx: -1, dy: 0, symbol: '⬅️' },
  { name: 'right', dx: 1, dy: 0, symbol: '➡️' }
];

/**
 * Finds the optimal next move toward the closest goal (apple or portal)
 * using Breadth-First Search (BFS).
 */
export function findSmartHint(state) {
  const { worm, apples, obstacles, portal, gridSize } = state;
  const { cols, rows } = gridSize;

  if (!worm || worm.length === 0) return null;
  const head = worm[0];

  // Determine current primary goal
  const hasRemainingApples = apples && apples.length > 0;
  const targets = hasRemainingApples ? apples : [portal];

  if (!targets || targets.length === 0) {
    return {
      direction: null,
      message: 'No remaining targets on the board!'
    };
  }

  // Obstacle coordinate set for O(1) lookup
  const obstacleSet = new Set(obstacles.map((o) => `${o.x},${o.y}`));

  // Current worm body set (excluding tail, since tail vacates if no apple eaten)
  const bodySet = new Set(worm.slice(1, -1).map((s) => `${s.x},${s.y}`));

  // BFS Queue: [ { x, y, firstMove, distance } ]
  const queue = [];
  const visited = new Set();
  const startKey = `${head.x},${head.y}`;
  visited.add(startKey);

  for (const dir of DIRECTIONS) {
    const nx = head.x + dir.dx;
    const ny = head.y + dir.dy;

    // Check bounds
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;

    // Check obstacle
    if (obstacleSet.has(`${nx},${ny}`)) continue;

    // Prevent immediate 180° neck reversal
    if (worm.length > 1 && nx === worm[1].x && ny === worm[1].y) continue;

    // Check body collision
    if (bodySet.has(`${nx},${ny}`)) continue;

    const nextKey = `${nx},${ny}`;
    visited.add(nextKey);
    queue.push({ x: nx, y: ny, firstMove: dir, distance: 1 });
  }

  // Run BFS search
  let closestTarget = null;
  let optimalFirstMove = null;
  let minDistance = Infinity;

  while (queue.length > 0) {
    const current = queue.shift();

    // Check if reached any target
    for (const target of targets) {
      if (current.x === target.x && current.y === target.y) {
        if (current.distance < minDistance) {
          minDistance = current.distance;
          optimalFirstMove = current.firstMove;
          closestTarget = target;
        }
        break;
      }
    }

    if (optimalFirstMove) break; // Found shortest path

    // Explore neighbors
    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (obstacleSet.has(`${nx},${ny}`)) continue;
      if (bodySet.has(`${nx},${ny}`)) continue;

      const key = `${nx},${ny}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          x: nx,
          y: ny,
          firstMove: current.firstMove,
          distance: current.distance + 1
        });
      }
    }
  }

  if (optimalFirstMove && closestTarget) {
    const targetType = hasRemainingApples ? 'apple' : 'exit portal';
    return {
      direction: optimalFirstMove.name,
      symbol: optimalFirstMove.symbol,
      target: closestTarget,
      distance: minDistance,
      message: `Hint: Move ${optimalFirstMove.name.toUpperCase()} ${optimalFirstMove.symbol} towards the ${targetType} at (${closestTarget.x}, ${closestTarget.y})!`
    };
  }

  return {
    direction: null,
    message: 'No clear path found! You might be blocked by obstacles. Try using Undo to take another route.'
  };
}

