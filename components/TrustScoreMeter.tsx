import React from 'react';
import styles from './TrustScoreMeter.module.css';

interface TrustScoreMeterProps {
  score: number;
}

const TrustScoreMeter: React.FC<TrustScoreMeterProps> = ({ score }) => {
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score < 40) return '#e53e3e'; // Red
    if (score < 70) return '#dd6b20'; // Orange
    return '#38a169'; // Green
  };

  return (
    <div className={styles.meterContainer}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className={styles.meterSvg}
      >
        <circle
          stroke="#e6e6e6"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getScoreColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, strokeLinecap: 'round' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={styles.progressCircle}
        />
      </svg>
      <div className={styles.scoreText}>
        <strong>{score}</strong>
        <span>/100</span>
      </div>
      <div className={styles.label}>Trust Score</div>
    </div>
  );
};

export default TrustScoreMeter;
