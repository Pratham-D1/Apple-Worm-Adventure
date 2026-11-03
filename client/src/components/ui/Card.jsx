// ==========================================
// Apple Worm Adventure - UI Card Component
// ==========================================

import React from 'react';
import './ui.css';

export const Card = ({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
  onClick,
  ...props
}) => {
  const classes = [
    'game-card',
    `game-card--${variant}`,
    hoverable ? 'game-card--hoverable' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

