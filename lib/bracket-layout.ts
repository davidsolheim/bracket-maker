import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Match, Player, TournamentFormat, TournamentFormatConfig } from '@/types/tournament';

// Node dimensions
const MATCH_NODE_WIDTH = 220;
const MATCH_NODE_HEIGHT = 100;
const CHAMPION_NODE_WIDTH = 280;
const CHAMPION_NODE_HEIGHT = 160;
const GROUP_NODE_WIDTH = 320;
const GROUP_NODE_HEIGHT = 280;
const SWISS_ROUND_NODE_WIDTH = 300;
const SWISS_ROUND_NODE_HEIGHT = 200;
const STANDINGS_NODE_WIDTH = 350;
const STANDINGS_NODE_HEIGHT = 400;

// Spacing
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 40;

export interface BracketNode extends Node {
  data: {
    match?: Match;
    matches?: Match[];
    player?: Player;
    players: Player[];
    isChampion?: boolean;
    groupId?: string;
    groupMatches?: Match[];
    swissRound?: number;
    roundMatches?: Match[];
    standings?: { playerId: string; wins: number; losses: number }[];
    onMatchClick?: (match: Match) => void;
    onOverrideClick?: (match: Match) => void;
    activeMatchId?: string;
  };
}

export interface BracketEdge extends Edge {
  data?: {
    isWinnerPath?: boolean;
    isLoserPath?: boolean;
    isAnimated?: boolean;
  };
}

export interface LayoutResult {
  nodes: BracketNode[];
  edges: BracketEdge[];
}

/**
 * Generate React Flow layout for single elimination bracket
 */
export function layoutSingleElimination(
  matches: Match[],
  players: Player[],
  winner: Player | null,
  callbacks: {
    onMatchClick?: (match: Match) => void;
    onOverrideClick?: (match: Match) => void;
    activeMatchId?: string;
  }
): LayoutResult {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  const winnersMatches = matches.filter(m => m.bracket === 'winners');
  const maxRound = Math.max(...winnersMatches.map(m => m.round), 0);
  
  // Group matches by round
  const matchesByRound: Record<number, Match[]> = {};
  for (let r = 1; r <= maxRound; r++) {
    matchesByRound[r] = winnersMatches
      .filter(m => m.round === r)
      .sort((a, b) => a.position - b.position);
  }
  
  // Position matches
  for (let round = 1; round <= maxRound; round++) {
    const roundMatches = matchesByRound[round] || [];
    const totalMatchesInRound = roundMatches.length;
    const roundHeight = totalMatchesInRound * (MATCH_NODE_HEIGHT + VERTICAL_SPACING);
    
    roundMatches.forEach((match, index) => {
      const x = (round - 1) * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING);
      // Center matches vertically, with more spacing for earlier rounds
      const spacingMultiplier = Math.pow(2, maxRound - round);
      const y = index * (MATCH_NODE_HEIGHT + VERTICAL_SPACING) * spacingMultiplier + 
                ((spacingMultiplier - 1) * (MATCH_NODE_HEIGHT + VERTICAL_SPACING)) / 2;
      
      nodes.push({
        id: match.id,
        type: 'matchNode',
        position: { x, y },
        data: {
          match,
          players,
          ...callbacks,
        },
      });
      
      // Create edge to next match
      if (match.nextMatchId) {
        const isComplete = match.winnerId !== null;
        edges.push({
          id: `${match.id}->${match.nextMatchId}`,
          source: match.id,
          target: match.nextMatchId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'bracketEdge',
          data: {
            isWinnerPath: isComplete,
            isAnimated: !isComplete,
          },
        });
      }
    });
  }
  
  // Add champion node if tournament is complete
  if (winner) {
    const finalMatch = winnersMatches.find(m => m.round === maxRound);
    if (finalMatch) {
      const x = maxRound * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING);
      const y = (nodes.find(n => n.id === finalMatch.id)?.position.y || 0) - 30;
      
      nodes.push({
        id: 'champion',
        type: 'championNode',
        position: { x, y },
        data: {
          player: winner,
          players,
          isChampion: true,
        },
      });
      
      edges.push({
        id: `${finalMatch.id}->champion`,
        source: finalMatch.id,
        target: 'champion',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'bracketEdge',
        data: {
          isWinnerPath: true,
        },
      });
    }
  }
  
  return { nodes, edges };
}

/**
 * Generate React Flow layout for double elimination bracket
 */
export function layoutDoubleElimination(
  matches: Match[],
  players: Player[],
  winner: Player | null,
  callbacks: {
    onMatchClick?: (match: Match) => void;
    onOverrideClick?: (match: Match) => void;
    activeMatchId?: string;
  }
): LayoutResult {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  const winnersMatches = matches.filter(m => m.bracket === 'winners');
  const losersMatches = matches.filter(m => m.bracket === 'losers');
  const grandFinalsMatches = matches.filter(m => m.bracket === 'grand-finals');
  
  const maxWinnersRound = Math.max(...winnersMatches.map(m => m.round), 0);
  const maxLosersRound = Math.max(...losersMatches.map(m => m.round), 0);
  
  // Calculate winners bracket height for offset
  const winnersHeight = Math.pow(2, maxWinnersRound - 1) * (MATCH_NODE_HEIGHT + VERTICAL_SPACING);
  const losersOffsetY = winnersHeight + 100;
  
  // Layout winners bracket
  for (let round = 1; round <= maxWinnersRound; round++) {
    const roundMatches = winnersMatches
      .filter(m => m.round === round)
      .sort((a, b) => a.position - b.position);
    
    roundMatches.forEach((match, index) => {
      const x = (round - 1) * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING);
      const spacingMultiplier = Math.pow(2, maxWinnersRound - round);
      const y = index * (MATCH_NODE_HEIGHT + VERTICAL_SPACING) * spacingMultiplier +
                ((spacingMultiplier - 1) * (MATCH_NODE_HEIGHT + VERTICAL_SPACING)) / 2;
      
      nodes.push({
        id: match.id,
        type: 'matchNode',
        position: { x, y },
        data: { match, players, ...callbacks },
      });
      
      // Winner edge
      if (match.nextMatchId) {
        edges.push({
          id: `${match.id}->${match.nextMatchId}`,
          source: match.id,
          target: match.nextMatchId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'bracketEdge',
          data: { isWinnerPath: match.winnerId !== null, isAnimated: !match.winnerId },
        });
      }
      
      // Loser edge (to losers bracket)
      if (match.loserNextMatchId) {
        edges.push({
          id: `${match.id}->${match.loserNextMatchId}-loser`,
          source: match.id,
          target: match.loserNextMatchId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'bracketEdge',
          data: { isLoserPath: true, isAnimated: true },
        });
      }
    });
  }
  
  // Layout losers bracket
  for (let round = 1; round <= maxLosersRound; round++) {
    const roundMatches = losersMatches
      .filter(m => m.round === round)
      .sort((a, b) => a.position - b.position);
    
    roundMatches.forEach((match, index) => {
      // Losers bracket is compressed horizontally
      const x = Math.floor((round - 1) / 2) * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING);
      const roundMatchCount = roundMatches.length;
      const y = losersOffsetY + index * (MATCH_NODE_HEIGHT + VERTICAL_SPACING * 0.5);
      
      nodes.push({
        id: match.id,
        type: 'matchNode',
        position: { x, y },
        data: { match, players, ...callbacks },
      });
      
      if (match.nextMatchId) {
        edges.push({
          id: `${match.id}->${match.nextMatchId}`,
          source: match.id,
          target: match.nextMatchId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'bracketEdge',
          data: { isWinnerPath: match.winnerId !== null, isAnimated: !match.winnerId },
        });
      }
    });
  }
  
  // Layout grand finals
  const gfX = Math.max(maxWinnersRound, Math.ceil(maxLosersRound / 2)) * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING);
  
  grandFinalsMatches.forEach((match, index) => {
    const y = losersOffsetY / 2 - MATCH_NODE_HEIGHT / 2 + index * (MATCH_NODE_HEIGHT + VERTICAL_SPACING);
    
    nodes.push({
      id: match.id,
      type: 'matchNode',
      position: { x: gfX + index * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING / 2), y },
      data: { match, players, ...callbacks },
    });
    
    if (match.nextMatchId) {
      edges.push({
        id: `${match.id}->${match.nextMatchId}`,
        source: match.id,
        target: match.nextMatchId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'bracketEdge',
        data: { isWinnerPath: match.winnerId !== null },
      });
    }
  });
  
  // Champion node
  if (winner) {
    const lastGF = grandFinalsMatches[grandFinalsMatches.length - 1];
    if (lastGF) {
      const lastGFNode = nodes.find(n => n.id === lastGF.id);
      if (lastGFNode) {
        nodes.push({
          id: 'champion',
          type: 'championNode',
          position: { 
            x: lastGFNode.position.x + MATCH_NODE_WIDTH + HORIZONTAL_SPACING, 
            y: lastGFNode.position.y - 30 
          },
          data: { player: winner, players, isChampion: true },
        });
        
        edges.push({
          id: `${lastGF.id}->champion`,
          source: lastGF.id,
          target: 'champion',
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'bracketEdge',
          data: { isWinnerPath: true },
        });
      }
    }
  }
  
  return { nodes, edges };
}

/**
 * Generate React Flow layout for round robin
 */
export function layoutRoundRobin(
  matches: Match[],
  players: Player[],
  callbacks: {
    onMatchClick?: (match: Match) => void;
    activeMatchId?: string;
  }
): LayoutResult {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  // Group matches by round
  const matchesByRound = new Map<number, Match[]>();
  matches.forEach(match => {
    const round = match.round;
    if (!matchesByRound.has(round)) {
      matchesByRound.set(round, []);
    }
    matchesByRound.get(round)!.push(match);
  });
  
  const rounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
  
  // Add standings node on the left
  nodes.push({
    id: 'standings',
    type: 'standingsNode',
    position: { x: 0, y: 0 },
    data: {
      players,
      matches,
    },
  });
  
  // Layout match nodes in a grid
  const matchesPerRow = 3;
  const startX = STANDINGS_NODE_WIDTH + HORIZONTAL_SPACING;
  
  rounds.forEach((round, roundIndex) => {
    const roundMatches = matchesByRound.get(round) || [];
    
    roundMatches.forEach((match, matchIndex) => {
      const col = matchIndex % matchesPerRow;
      const row = Math.floor(matchIndex / matchesPerRow);
      
      const x = startX + col * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING / 2);
      const y = roundIndex * (roundMatches.length > matchesPerRow ? 2 : 1) * (MATCH_NODE_HEIGHT + VERTICAL_SPACING) + 
                row * (MATCH_NODE_HEIGHT + VERTICAL_SPACING);
      
      nodes.push({
        id: match.id,
        type: 'matchNode',
        position: { x, y },
        data: { match, players, ...callbacks },
      });
    });
  });
  
  return { nodes, edges };
}

/**
 * Generate React Flow layout for Swiss system
 */
export function layoutSwiss(
  matches: Match[],
  players: Player[],
  currentRound: number,
  callbacks: {
    onMatchClick?: (match: Match) => void;
    activeMatchId?: string;
  }
): LayoutResult {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  // Group matches by round
  const matchesByRound = new Map<number, Match[]>();
  matches.forEach(match => {
    if (!matchesByRound.has(match.round)) {
      matchesByRound.set(match.round, []);
    }
    matchesByRound.get(match.round)!.push(match);
  });
  
  // Add standings node
  nodes.push({
    id: 'standings',
    type: 'standingsNode',
    position: { x: 0, y: 0 },
    data: { players, matches },
  });
  
  // Layout rounds as columns
  const rounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
  const startX = STANDINGS_NODE_WIDTH + HORIZONTAL_SPACING;
  
  rounds.forEach((round) => {
    const roundMatches = matchesByRound.get(round) || [];
    const x = startX + (round - 1) * (MATCH_NODE_WIDTH + HORIZONTAL_SPACING);
    
    roundMatches.forEach((match, index) => {
      const y = index * (MATCH_NODE_HEIGHT + VERTICAL_SPACING / 2);
      
      nodes.push({
        id: match.id,
        type: 'matchNode',
        position: { x, y },
        data: { match, players, ...callbacks },
      });
    });
  });
  
  return { nodes, edges };
}

/**
 * Generate React Flow layout for group knockout
 */
export function layoutGroupKnockout(
  matches: Match[],
  players: Player[],
  formatConfig: TournamentFormatConfig | undefined,
  groupStageComplete: boolean,
  winner: Player | null,
  callbacks: {
    onMatchClick?: (match: Match) => void;
    onOverrideClick?: (match: Match) => void;
    activeMatchId?: string;
  }
): LayoutResult {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  const groupMatches = matches.filter(m => m.bracket === 'group');
  const knockoutMatches = matches.filter(m => m.bracket !== 'group');
  
  // Get unique groups
  const groups = new Set<string>();
  groupMatches.forEach(m => {
    if (m.groupId) groups.add(m.groupId);
  });
  const sortedGroups = Array.from(groups).sort();
  
  // Layout group nodes
  const groupsPerRow = 2;
  sortedGroups.forEach((groupId, index) => {
    const col = index % groupsPerRow;
    const row = Math.floor(index / groupsPerRow);
    
    const x = col * (GROUP_NODE_WIDTH + HORIZONTAL_SPACING);
    const y = row * (GROUP_NODE_HEIGHT + VERTICAL_SPACING);
    
    const groupPlayerIds = new Set<string>();
    const thisGroupMatches = groupMatches.filter(m => m.groupId === groupId);
    thisGroupMatches.forEach(m => {
      if (m.player1Id) groupPlayerIds.add(m.player1Id);
      if (m.player2Id) groupPlayerIds.add(m.player2Id);
    });
    
    nodes.push({
      id: `group-${groupId}`,
      type: 'groupNode',
      position: { x, y },
      data: {
        groupId,
        groupMatches: thisGroupMatches,
        players: players.filter(p => groupPlayerIds.has(p.id)),
        ...callbacks,
      },
    });
  });
  
  // If group stage complete, add knockout bracket
  if (groupStageComplete && knockoutMatches.length > 0) {
    const knockoutStartX = Math.ceil(sortedGroups.length / groupsPerRow) > 1 
      ? 2 * (GROUP_NODE_WIDTH + HORIZONTAL_SPACING)
      : sortedGroups.length * (GROUP_NODE_WIDTH + HORIZONTAL_SPACING);
    
    const knockoutLayout = layoutSingleElimination(
      knockoutMatches.map(m => ({ ...m, bracket: 'winners' as const })),
      players,
      winner,
      callbacks
    );
    
    // Offset knockout nodes
    knockoutLayout.nodes.forEach(node => {
      node.position.x += knockoutStartX;
      nodes.push(node);
    });
    
    edges.push(...knockoutLayout.edges);
  }
  
  return { nodes, edges };
}

/**
 * Apply dagre layout algorithm for automatic positioning
 */
export function applyDagreLayout(
  nodes: BracketNode[],
  edges: BracketEdge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: BracketNode[]; edges: BracketEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: VERTICAL_SPACING, ranksep: HORIZONTAL_SPACING });
  g.setDefaultEdgeLabel(() => ({}));
  
  nodes.forEach(node => {
    const width = node.type === 'championNode' ? CHAMPION_NODE_WIDTH :
                  node.type === 'groupNode' ? GROUP_NODE_WIDTH :
                  node.type === 'standingsNode' ? STANDINGS_NODE_WIDTH :
                  MATCH_NODE_WIDTH;
    const height = node.type === 'championNode' ? CHAMPION_NODE_HEIGHT :
                   node.type === 'groupNode' ? GROUP_NODE_HEIGHT :
                   node.type === 'standingsNode' ? STANDINGS_NODE_HEIGHT :
                   MATCH_NODE_HEIGHT;
    g.setNode(node.id, { width, height });
  });
  
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(g);
  
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });
  
  return { nodes: layoutedNodes, edges };
}

/**
 * Main layout function that routes to format-specific layout
 */
export function generateBracketLayout(
  matches: Match[],
  players: Player[],
  format: TournamentFormat,
  options: {
    formatConfig?: TournamentFormatConfig;
    currentSwissRound?: number;
    groupStageComplete?: boolean;
    winner?: Player | null;
    onMatchClick?: (match: Match) => void;
    onOverrideClick?: (match: Match) => void;
    activeMatchId?: string;
  }
): LayoutResult {
  const callbacks = {
    onMatchClick: options.onMatchClick,
    onOverrideClick: options.onOverrideClick,
    activeMatchId: options.activeMatchId,
  };
  
  switch (format) {
    case 'single-elimination':
      return layoutSingleElimination(matches, players, options.winner || null, callbacks);
    
    case 'double-elimination':
      return layoutDoubleElimination(matches, players, options.winner || null, callbacks);
    
    case 'round-robin':
      return layoutRoundRobin(matches, players, callbacks);
    
    case 'swiss':
      return layoutSwiss(matches, players, options.currentSwissRound || 1, callbacks);
    
    case 'group-knockout':
      return layoutGroupKnockout(
        matches,
        players,
        options.formatConfig,
        options.groupStageComplete || false,
        options.winner || null,
        callbacks
      );
    
    default:
      return { nodes: [], edges: [] };
  }
}
