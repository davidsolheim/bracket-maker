# Bracket Maker

A modern tournament bracket management application for creating and managing double elimination tournaments. Perfect for organizing bumper pool tournaments, esports competitions, or any bracket-based competition.

![Bracket Maker](https://via.placeholder.com/800x400?text=Bracket+Maker+Tournament+Manager)

## Features

- **Double Elimination Brackets** - Full support for winners bracket, losers bracket, and grand finals
- **Visual Bracket Display** - Beautiful SVG connecting lines showing match progression
- **Player Management** - Create and save player lists for reuse across tournaments
- **Match Scoring** - Easy-to-use score entry with keyboard shortcuts
- **Edit Completed Matches** - Correct mistakes by editing scores with automatic cascade reset
- **Player Statistics** - Track wins, losses, and win rates across all tournaments
- **Export Results** - Export tournament data as JSON or CSV
- **Dark Mode** - Manual theme toggle with system preference support
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Animations** - Smooth animations for match completions and bracket connections

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Zod** - Runtime type validation
- **Sonner** - Toast notifications
- **Canvas Confetti** - Celebration animations

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Package manager: npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bracket-maker
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Run the development server:
```bash
bun dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating a Tournament

1. Click "New Tournament" in the header
2. Enter a tournament name
3. Add players (manually or load from a saved list)
4. Optionally shuffle players for random seeding
5. Click "Create & Start Tournament" to begin

### Managing Matches

- Click on any match card to enter scores
- Use keyboard shortcuts:
  - `↑`/`↓` arrows to adjust scores
  - `Enter` to save
  - `Esc` to cancel
- Completed matches can be edited (with confirmation)

### Viewing Statistics

- Visit the "Stats" page to see all-time player records
- Statistics include wins, losses, win rate, and tournament count

### Exporting Results

- On completed tournaments, use "Export JSON" or "Export CSV" buttons
- JSON exports include full tournament data
- CSV exports include match results in tabular format

## Project Structure

```
bracket-maker/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Dashboard
│   ├── tournament/        # Tournament pages
│   ├── stats/             # Player statistics
│   └── players/           # Player list management
├── components/            # React components
│   ├── bracket/          # Bracket visualization
│   ├── match/            # Match cards and scoring
│   ├── player/           # Player management
│   └── ui/               # Reusable UI components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── bracket.ts        # Bracket generation logic
│   ├── storage.ts        # LocalStorage helpers
│   └── validators.ts     # Zod schemas
└── types/                # TypeScript type definitions
```

## Development

### Building for Production

```bash
bun run build
# or
npm run build
```

### Running Production Build

```bash
bun start
# or
npm start
```

### Linting

```bash
bun run lint
# or
npm run lint
```

## Data Storage

All tournament data is stored locally in your browser using localStorage. This means:
- Data persists between sessions
- No server or database required
- Data is private to your browser
- Export functionality available for backup

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
