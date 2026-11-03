// ==========================================
// Apple Worm Adventure - 404 Not Found Page
// ==========================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import './pages.css';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <Card className="notfound-card">
        <div className="notfound-icon animate-bounce">🐛❓</div>
        <h1>404 - Lost in the Orchard!</h1>
        <p className="notfound-desc">
          Your little worm wandered into uncharted garden territory.
          The page or puzzle path you were looking for doesn't exist.
        </p>

        <div className="notfound-actions">
          <Button variant="primary" size="lg" icon="🏡" onClick={() => navigate('/')}>
            Return to Orchard Home
          </Button>
          <Button variant="outline" size="lg" icon="🗺️" onClick={() => navigate('/levels')}>
            Browse Levels
          </Button>
        </div>
      </Card>
    </div>
  );
};

