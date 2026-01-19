'use client';

import React, { useState, useEffect } from 'react';
import styles from './TrustScoreMeter.module.css';

type TrustScoreMeterProps = {
  score: number;
  size?: 'small' | 'medium' | 'large';
};

export const TrustScoreMeter = ({ score, size = 'medium' }: TrustScoreMeterProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animated score counting
  useEffect(() => {
    setIsVisible(true);
    const duration = 1200; // 1.2 seconds
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score]);

  // Adjust dimensions based on size
  const baseRadius = size === 'small' ? 25 : size === 'large' ? 75 : 50;
  const stroke = size === 'small' ? 4 : size === 'large' ? 10 : 8;
  
  const radius = baseRadius;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = isVisible 
    ? circumference - (score / 100) * circumference 
    : circumference; // Start with full offset (empty circle)

  const getScoreColor = () => {
    if (score < 40) return '#ef4444'; // Red
    if (score < 70) return '#f59e0b'; // Amber
    return 'var(--accent-primary)'; // Green (using CSS variable)
  };

  // Dynamic font sizes
  const fontSizeTitle = size === 'small' ? '10px' : size === 'large' ? '28px' : '18px';
  const fontSizeSub = size === 'small' ? '8px' : size === 'large' ? '12px' : '10px';

  return (
    <div className={styles.meterContainer} style={{ width: radius * 2, height: 'auto' }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className={styles.meterSvg}
          role="img"
          aria-label={`Trust score: ${score} out of 100`}
        >
          {/* Background circle */}
          <circle
            stroke="var(--border-primary)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={getScoreColor()}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ 
              strokeDashoffset, 
              strokeLinecap: 'round', 
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)'
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={styles.progressCircle}
          />
        </svg>
        {/* Score text overlay */}
        <div 
          className={styles.scoreText}
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            color: 'var(--text-primary)' 
          }}
        >
          <strong style={{ fontSize: fontSizeTitle, lineHeight: 1, fontWeight: 700 }}>
            {displayScore}
          </strong>
          {size !== 'small' && (
            <span style={{ fontSize: fontSizeSub, opacity: 0.6, marginTop: '2px' }}>/100</span>
          )}
        </div>
      </div>
      {size !== 'small' && (
        <div className={styles.label} style={{ color: 'var(--text-secondary)' }}>
          Trust Score
        </div>
      )}
    </div>
  );
};
