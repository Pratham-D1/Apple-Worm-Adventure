// ==========================================
// Apple Worm Adventure - Mock Data (Phase 5)
// ==========================================

import { ALL_LEVELS, WORLDS_METADATA } from './levelsData.js';

export { ALL_LEVELS, WORLDS_METADATA };
export const INITIAL_LEVELS = ALL_LEVELS;

export const INITIAL_USER = {
  id: 'usr_mock_01',
  username: 'WormAdventurer',
  email: 'player@appleworm.dev',
  role: 'player',
  walletBalance: 320,
  totalScore: 3680,
  completedLevelsCount: 1,
  totalStars: 3,
  gamesPlayed: 14,
  joinedDate: 'October 2026',
  avatar: '🐛'
};

export const RECENT_GAME_HISTORY = [
  {
    id: 'gh_101',
    levelNumber: 1,
    levelTitle: 'Garden Gateway',
    score: 1450,
    movesUsed: 5,
    maxMoves: 15,
    stars: 3,
    status: 'Completed',
    date: '2026-11-03 00:15'
  }
];

export const REWARD_STORE_ITEMS = [
  {
    id: 'rew_revive',
    title: 'Revive Token',
    description: 'Continue your puzzle run immediately after a fall or trap mistake.',
    cost: 50,
    icon: '💖',
    category: 'Game Helper',
    tag: 'Popular'
  },
  {
    id: 'rew_double_score',
    title: 'Double Score Boost',
    description: 'Multiplies your final level victory score by 2x for the next 3 games.',
    cost: 80,
    icon: '⚡',
    category: 'Booster',
    tag: 'Hot'
  },
  {
    id: 'rew_double_coins',
    title: 'Double Coins Charm',
    description: 'Earn 2x VELoop reward coins on every apple eaten and level completed.',
    cost: 100,
    icon: '💰',
    category: 'Economy',
    tag: 'Best Value'
  },
  {
    id: 'rew_extra_moves',
    title: 'Extra Moves (+5)',
    description: 'Grants +5 extra moves whenever you are tight on the move threshold.',
    cost: 40,
    icon: '👟',
    category: 'Game Helper',
    tag: null
  },
  {
    id: 'rew_smart_hint',
    title: 'Smart Apple Hint',
    description: 'Highlights the next 3 optimal coordinate steps toward the closest apple.',
    cost: 60,
    icon: '💡',
    category: 'Game Helper',
    tag: null
  },
  {
    id: 'rew_golden_skin',
    title: 'Golden Apple Worm',
    description: 'Cosmetic shining golden skin for your worm character in the game board.',
    cost: 250,
    icon: '✨',
    category: 'Cosmetic',
    tag: 'Exclusive'
  }
];

export const LEADERBOARD_DATA = [
  { rank: 1, username: 'WormSage99', score: 48890, level: 50, moves: 480, stars: 150, badge: '🥇' },
  { rank: 2, username: 'AppleCruncher', score: 43950, level: 45, moves: 510, stars: 135, badge: '🥈' },
  { rank: 3, username: 'PixelCaterpillar', score: 38700, level: 40, moves: 540, stars: 120, badge: '🥉' },
  { rank: 4, username: 'OrchardNinja', score: 31200, level: 32, moves: 420, stars: 96, badge: '4' },
  { rank: 5, username: 'GreenCrawler', score: 24800, level: 25, moves: 360, stars: 75, badge: '5' },
  { rank: 6, username: 'WormAdventurer', score: 3680, level: 2, moves: 24, stars: 6, badge: '6 (You)' },
  { rank: 7, username: 'CrispBite', score: 3200, level: 3, moves: 70, stars: 7, badge: '7' },
  { rank: 8, username: 'RedDelicious', score: 2850, level: 3, moves: 75, stars: 6, badge: '8' },
  { rank: 9, username: 'VineClimber', score: 2100, level: 2, moves: 42, stars: 5, badge: '9' },
  { rank: 10, username: 'SeedSprout', score: 1450, level: 1, moves: 15, stars: 3, badge: '10' }
];

export const ADMIN_MOCK_DATA = {
  metrics: {
    totalUsers: 1420,
    activeLevels: 50,
    coinsCirculated: 84500,
    rewardsClaimed: 312
  },
  economyConfig: {
    levelCompleteBaseReward: 50,
    dailyLoginReward: 25,
    starBonusMultiplier: 1.5,
    maxDailyClaims: 5,
    economyStatus: 'Active'
  },
  recentUsers: [
    { id: 'usr_01', username: 'WormAdventurer', email: 'player@appleworm.dev', role: 'player', wallet: 320, joined: '2026-11-01' },
    { id: 'usr_02', username: 'AppleCruncher', email: 'crunch@appleworm.dev', role: 'player', wallet: 940, joined: '2026-10-28' },
    { id: 'usr_03', username: 'WormSage99', email: 'sage@appleworm.dev', role: 'player', wallet: 1450, joined: '2026-10-20' },
    { id: 'usr_04', username: 'AdminMaster', email: 'admin@appleworm.dev', role: 'admin', wallet: 5000, joined: '2026-10-15' }
  ],
  recentTransactions: [
    { id: 'tx_991', user: 'WormAdventurer', type: 'reward', amount: '+50', source: 'level_complete', key: 'idemp_lvl_01_a83f', date: '2026-11-02 17:15' },
    { id: 'tx_992', user: 'WormAdventurer', type: 'reward', amount: '+50', source: 'level_complete', key: 'idemp_lvl_02_c94e', date: '2026-11-02 17:50' },
    { id: 'tx_993', user: 'AppleCruncher', type: 'spend', amount: '-80', source: 'reward_store', key: 'idemp_spn_04_f11a', date: '2026-11-02 15:10' },
    { id: 'tx_994', user: 'WormSage99', type: 'bonus', amount: '+100', source: 'daily_login', key: 'idemp_dly_02_e55b', date: '2026-11-02 09:00' }
  ]
};
