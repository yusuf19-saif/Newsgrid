'use client';

import { TrustScoreMeter } from './TrustScoreMeter';
import styles from './TrustScoreBreakdown.module.css';

type VerificationReport = {
  individualScores?: Record<string, number>;
  whyThisScore?: string;
  overallSummary?: string;
};

type TrustScoreBreakdownProps = {
  score: number;
  credibilityRating: string | null;
  verificationReport: Record<string, unknown> | null;
};

// Get credibility rating color based on label
const getCredibilityColors = (rating: string | null): { color: string; bgColor: string } => {
  switch (rating) {
    case 'Highly Credible':
      return { color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)' };
    case 'Credible':
      return { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' };
    case 'Mixed':
      return { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
    case 'Low Credibility':
      return { color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
    case 'Unreliable':
      return { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
    default:
      return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
  }
};

export const TrustScoreBreakdown = ({ 
  score, 
  credibilityRating, 
  verificationReport 
}: TrustScoreBreakdownProps) => {
  const report = verificationReport as VerificationReport | null;
  const individualScores = report?.individualScores || {};
  const whyThisScore = report?.whyThisScore || '';
  const colors = getCredibilityColors(credibilityRating);

  return (
    <div className={styles.container}>
      <TrustScoreMeter score={score} size="large" />
      
      {credibilityRating && (
        <div 
          className={styles.credibilityBadge}
          style={{ 
            color: colors.color, 
            backgroundColor: colors.bgColor,
            border: `1px solid ${colors.color}`,
          }}
        >
          {credibilityRating}
        </div>
      )}

      {/* Score Breakdown */}
      {Object.keys(individualScores).length > 0 && (
        <div className={styles.scoreBreakdown}>
          <h4 className={styles.breakdownTitle}>Score Breakdown</h4>
          {Object.entries(individualScores).map(([label, value]) => (
            <div key={label} className={styles.scoreItem}>
              <span className={styles.scoreLabel}>
                {label.replace(/\s*Score\s*$/i, '')}
              </span>
              <span className={styles.scoreValue}>
                {label.toLowerCase().includes('modifier') ? (
                  value >= 0 ? `+${value}` : value
                ) : (
                  `${value}/100`
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Why This Score */}
      {whyThisScore && (
        <div className={styles.whyThisScore}>
          <strong>Why This Score</strong>
          <p>{whyThisScore.replace(/\*\*/g, '')}</p>
        </div>
      )}

      <p className={styles.disclaimer}>
        Based on factual accuracy, source quality, and citation coverage.
      </p>
    </div>
  );
};

