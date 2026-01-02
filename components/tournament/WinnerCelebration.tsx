'use client';

import { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Tournament, Player, TournamentFormat } from '@/types/tournament';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WinnerCelebrationProps {
  tournament: Tournament;
}

// Esports-themed confetti colors
const CONFETTI_COLORS = [
  '#00f5ff', // cyan
  '#ff00ff', // magenta
  '#39ff14', // green
  '#ffd700', // gold
  '#ff6b00', // orange
];

export function WinnerCelebration({ tournament }: WinnerCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStage, setCelebrationStage] = useState(0);
  
  // Find the winner based on format
  const winner = getWinner(tournament);
  const runnerUp = getRunnerUp(tournament);
  const winnerJourney = getWinnerJourney(tournament, winner);
  
  // Multi-stage confetti burst
  const triggerConfettiBurst = useCallback(() => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    
    // Initial burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: CONFETTI_COLORS,
      startVelocity: 45,
      gravity: 1,
      ticks: 300,
      zIndex: 9999,
    });
    
    // Side cannons after short delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: CONFETTI_COLORS,
        startVelocity: 50,
        zIndex: 9999,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: CONFETTI_COLORS,
        startVelocity: 50,
        zIndex: 9999,
      });
    }, 300);
    
    // Continuous rain
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 30 * (timeLeft / duration);
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2,
        },
        colors: CONFETTI_COLORS,
        zIndex: 9999,
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  // Firework effect
  const triggerFireworks = useCallback(() => {
    const end = Date.now() + 3000;
    
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: CONFETTI_COLORS.slice(0, 3),
        zIndex: 9999,
      });
      
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: CONFETTI_COLORS.slice(2),
        zIndex: 9999,
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);
  
  useEffect(() => {
    if (tournament.status === 'completed' && winner) {
      // Start celebration sequence
      setShowCelebration(true);
      
      // Stage 1: Spotlight appears
      setCelebrationStage(1);
      
      // Stage 2: Trophy reveal (after 0.5s)
      setTimeout(() => setCelebrationStage(2), 500);
      
      // Stage 3: Champion name (after 1.5s)
      setTimeout(() => {
        setCelebrationStage(3);
        triggerConfettiBurst();
      }, 1500);
      
      // Stage 4: Full celebration (after 2.5s)
      setTimeout(() => {
        setCelebrationStage(4);
        triggerFireworks();
      }, 2500);
    }
  }, [tournament.status, winner, triggerConfettiBurst, triggerFireworks]);
  
  if (tournament.status !== 'completed' || !winner) return null;
  
  const formatSpecificContent = getFormatSpecificContent(tournament.format, winner, winnerJourney);
  
  return (
    <AnimatePresence>
      {showCelebration && (
        <>
          {/* Spotlight overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: celebrationStage >= 1 ? 1 : 0 }}
            exit={{ opacity: 0 }}
            className="spotlight"
          />
          
          {/* Main celebration card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={cn(
              'relative mb-8 rounded-2xl overflow-hidden',
              'bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-elevated)] to-[var(--bg-darker)]',
              'border-2 border-[var(--neon-gold)]/50',
              'shadow-[0_0_60px_rgba(255,215,0,0.2)]'
            )}
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none">
              <motion.div
                animate={{
                  background: [
                    'linear-gradient(0deg, var(--neon-gold), var(--neon-cyan), var(--neon-magenta), var(--neon-gold))',
                    'linear-gradient(360deg, var(--neon-gold), var(--neon-cyan), var(--neon-magenta), var(--neon-gold))',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-[-2px] rounded-2xl opacity-30 blur-sm"
              />
            </div>
            
            {/* Content */}
            <div className="relative p-8 md:p-12 text-center">
              {/* Format-specific badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: celebrationStage >= 1 ? 1 : 0, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30">
                  {formatSpecificContent.badge}
                </span>
              </motion.div>
              
              {/* Trophy */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -10 }}
                animate={{ 
                  opacity: celebrationStage >= 2 ? 1 : 0, 
                  scale: celebrationStage >= 2 ? 1 : 0,
                  rotate: 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="mb-6"
              >
                <span className="text-8xl md:text-9xl inline-block trophy-animate champion-glow">
                  🏆
                </span>
              </motion.div>
              
              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: celebrationStage >= 3 ? 1 : 0, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-bold mb-2 heading gradient-text-gold"
              >
                {formatSpecificContent.title}
              </motion.h2>
              
              {/* Winner name */}
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: celebrationStage >= 3 ? 1 : 0, 
                  scale: celebrationStage >= 3 ? 1 : 0.8,
                }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold text-white heading text-glow-gold mb-4"
              >
                {winner.name}
              </motion.p>
              
              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: celebrationStage >= 4 ? 1 : 0, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-8 mb-6"
              >
                {winner.wins !== undefined && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[var(--neon-green)] heading">
                      {winner.wins}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      Wins
                    </div>
                  </div>
                )}
                {winner.losses !== undefined && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[var(--neon-magenta)] heading">
                      {winner.losses}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      Losses
                    </div>
                  </div>
                )}
                {runnerUp && (
                  <div className="text-center">
                    <div className="text-lg font-medium text-[var(--text-secondary)]">
                      vs {runnerUp.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      Finals
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Journey recap */}
              {winnerJourney.length > 0 && celebrationStage >= 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="pt-6 border-t border-[var(--border-dim)]"
                >
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    Championship Journey
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {winnerJourney.map((opponent, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <span className="px-3 py-1 rounded bg-[var(--neon-green)]/10 text-[var(--neon-green)] text-sm font-medium">
                          vs {opponent}
                        </span>
                        {index < winnerJourney.length - 1 && (
                          <span className="text-[var(--text-muted)]">→</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Format-specific message */}
              {formatSpecificContent.message && celebrationStage >= 4 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-4 text-sm text-[var(--text-secondary)] italic"
                >
                  {formatSpecificContent.message}
                </motion.p>
              )}
            </div>
            
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[var(--neon-gold)] rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[var(--neon-gold)] rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[var(--neon-gold)] rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[var(--neon-gold)] rounded-br-2xl" />
            
            {/* Particle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0,
                    x: Math.random() * 100 - 50 + '%',
                    y: '100%',
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    y: '-100%',
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: 'linear',
                  }}
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    boxShadow: `0 0 6px ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper functions
function getWinner(tournament: Tournament): Player | null {
  const { format, matches, players } = tournament;
  
  if (format === 'double-elimination') {
    const grandFinals = matches.filter(m => m.bracket === 'grand-finals');
    const finalMatch = grandFinals.filter(m => m.round === 2).find(m => m.winnerId) ||
                       grandFinals.find(m => m.winnerId);
    return finalMatch ? players.find(p => p.id === finalMatch.winnerId) || null : null;
  }
  
  if (format === 'single-elimination' || format === 'group-knockout') {
    const winnersMatches = matches.filter(m => m.bracket === 'winners');
    const maxRound = Math.max(...winnersMatches.map(m => m.round), 0);
    const finalMatch = winnersMatches.find(m => m.round === maxRound && m.winnerId);
    return finalMatch ? players.find(p => p.id === finalMatch.winnerId) || null : null;
  }
  
  if (format === 'round-robin' || format === 'swiss') {
    // Winner is the player with most wins
    const playerWins = new Map<string, number>();
    players.forEach(p => playerWins.set(p.id, 0));
    
    matches.forEach(match => {
      if (match.winnerId) {
        playerWins.set(match.winnerId, (playerWins.get(match.winnerId) || 0) + 1);
      }
    });
    
    let maxWins = 0;
    let winnerId = '';
    playerWins.forEach((wins, id) => {
      if (wins > maxWins) {
        maxWins = wins;
        winnerId = id;
      }
    });
    
    return players.find(p => p.id === winnerId) || null;
  }
  
  return null;
}

function getRunnerUp(tournament: Tournament): Player | null {
  const { format, matches, players } = tournament;
  
  if (format === 'double-elimination') {
    const grandFinals = matches.filter(m => m.bracket === 'grand-finals');
    const finalMatch = grandFinals.filter(m => m.round === 2).find(m => m.winnerId) ||
                       grandFinals.find(m => m.winnerId);
    if (finalMatch) {
      const loserId = finalMatch.player1Id === finalMatch.winnerId 
        ? finalMatch.player2Id 
        : finalMatch.player1Id;
      return players.find(p => p.id === loserId) || null;
    }
  }
  
  if (format === 'single-elimination') {
    const winnersMatches = matches.filter(m => m.bracket === 'winners');
    const maxRound = Math.max(...winnersMatches.map(m => m.round), 0);
    const finalMatch = winnersMatches.find(m => m.round === maxRound && m.winnerId);
    if (finalMatch) {
      const loserId = finalMatch.player1Id === finalMatch.winnerId 
        ? finalMatch.player2Id 
        : finalMatch.player1Id;
      return players.find(p => p.id === loserId) || null;
    }
  }
  
  return null;
}

function getWinnerJourney(tournament: Tournament, winner: Player | null): string[] {
  if (!winner) return [];
  
  const { matches, players } = tournament;
  const journey: string[] = [];
  
  // Get all matches the winner participated in, sorted by round
  const winnerMatches = matches
    .filter(m => m.winnerId === winner.id)
    .sort((a, b) => a.round - b.round);
  
  winnerMatches.forEach(match => {
    const opponentId = match.player1Id === winner.id ? match.player2Id : match.player1Id;
    const opponent = players.find(p => p.id === opponentId);
    if (opponent) {
      journey.push(opponent.name);
    }
  });
  
  return journey.slice(-5); // Last 5 opponents
}

function getFormatSpecificContent(
  format: TournamentFormat,
  winner: Player,
  journey: string[]
): { badge: string; title: string; message?: string } {
  switch (format) {
    case 'single-elimination':
      return {
        badge: 'Tournament Champion',
        title: 'Undefeated Victor',
        message: journey.length > 0 ? `Conquered ${journey.length} opponents without a single loss!` : undefined,
      };
    
    case 'double-elimination':
      const cameFromLosers = (winner.losses || 0) > 0;
      return {
        badge: cameFromLosers ? 'Losers Bracket Champion' : 'Winners Bracket Champion',
        title: cameFromLosers ? 'The Ultimate Comeback!' : 'Dominant Champion',
        message: cameFromLosers 
          ? 'Fought through the losers bracket to claim the title!' 
          : 'Never dropped to losers bracket!',
      };
    
    case 'round-robin':
      return {
        badge: 'Round Robin Champion',
        title: 'Most Victorious',
        message: `Achieved ${winner.wins || 0} victories in the round robin!`,
      };
    
    case 'swiss':
      return {
        badge: 'Swiss Champion',
        title: 'Tournament Winner',
        message: 'Qualified and conquered the knockout stage!',
      };
    
    case 'group-knockout':
      return {
        badge: 'Group Stage + Knockout Champion',
        title: 'Ultimate Champion',
        message: 'Dominated the groups and knockout rounds!',
      };
    
    default:
      return {
        badge: 'Champion',
        title: 'Tournament Winner',
      };
  }
}
