// ==========================================
// Apple Worm Adventure - UI Badge Component
// ==========================================

import React from 'react';
import './ui.css';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon = null
}) => {
  const classes = [
    'game-badge',
    `game-badge--${variant}`,
    `game-badge--${size}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {icon && <span className="game-badge__icon">{icon}</span>}
      {children}
    </span>
  );
};

