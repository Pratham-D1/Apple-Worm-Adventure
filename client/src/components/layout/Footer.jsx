// ==========================================
// Apple Worm Adventure - Footer Component
// ==========================================

import React from 'react';
import './layout.css';

export const Footer = () => {
  return (
    <footer className="game-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">🍎🐛 APPLE WORM ADVENTURE</span>
        </div>

        <div className="footer-leds">
          <div className="footer-led-item">
            <span className="led-dot led-green"></span>
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="footer-led-item">
            <span className="led-dot led-amber"></span>
            <span>ARCADE 60FPS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

