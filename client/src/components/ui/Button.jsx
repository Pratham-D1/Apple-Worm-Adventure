// ==========================================
// Apple Worm Adventure - UI Button Component
// ==========================================

import React from 'react';
import './ui.css';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon = null,
  fullWidth = false,
  ...props
}) => {
  const classes = [
    'game-btn',
    `game-btn--${variant}`,
    `game-btn--${size}`,
    fullWidth ? 'game-btn--full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="game-btn__icon">{icon}</span>}
      <span className="game-btn__text">{children}</span>
    </button>
  );
};

