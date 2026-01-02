'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { motion } from 'framer-motion';

interface BracketEdgeData {
  isWinnerPath?: boolean;
  isLoserPath?: boolean;
  isAnimated?: boolean;
}

function BracketEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps & { data?: BracketEdgeData }) {
  const { isWinnerPath = false, isLoserPath = false, isAnimated = true } = data || {};
  
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });
  
  // Determine edge color based on state
  const getEdgeColor = () => {
    if (isWinnerPath) return 'var(--neon-green)';
    if (isLoserPath) return 'var(--neon-magenta)';
    return 'var(--text-muted)';
  };
  
  const edgeColor = getEdgeColor();
  
  return (
    <>
      {/* Glow layer for winner paths */}
      {isWinnerPath && (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={8}
          strokeOpacity={0.2}
          style={{ filter: `blur(4px)` }}
        />
      )}
      
      {/* Background/track layer */}
      <path
        d={edgePath}
        fill="none"
        stroke="var(--border-dim)"
        strokeWidth={2}
      />
      
      {/* Main edge */}
      {isAnimated && !isWinnerPath ? (
        <motion.path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={2}
          strokeDasharray="8 4"
          initial={{ strokeDashoffset: 24 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ opacity: 0.6 }}
        />
      ) : (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={isWinnerPath ? 3 : 2}
          strokeLinecap="round"
          style={{
            filter: isWinnerPath ? `drop-shadow(0 0 4px ${edgeColor})` : undefined,
          }}
        />
      )}
      
      {/* Arrow marker for winner paths */}
      {isWinnerPath && (
        <motion.circle
          r={4}
          fill={edgeColor}
          style={{
            offsetPath: `path("${edgePath}")`,
            offsetDistance: '0%',
            filter: `drop-shadow(0 0 3px ${edgeColor})`,
          }}
          animate={{
            offsetDistance: '100%',
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </>
  );
}

export const BracketEdge = memo(BracketEdgeComponent);
