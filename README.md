# LoL Arena Tracker

Track your League of Legends Arena champion progress with automatic updates from DDragon API.

## Features

- **Automatic Champion Updates**: Fetches the latest champion data from Riot's DDragon API
- **Progress Preservation**: Your tracking progress is automatically preserved when new champions are added
- **Import/Export Data**: Easily backup and restore your champion progress with JSON file support
- **Offline Fallback**: Works even when the API is unavailable using cached data
- **Real-time Sync**: Automatically updates with new champion releases
- **Manual Refresh**: Force update champion data with the refresh button
- **Arena Match Tracking**: Track and analyze your Arena game performance
- **Match History**: View detailed match history and statistics
- **Responsive Design**: Optimized for desktop and mobile devices
- **Grid Customization**: Adjustable grid layout with column controls
- **Visual Feedback**: Smooth animations and progress indicators

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/daniarnaizg/lol-arena-tracker.git
cd lol-arena-tracker
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup (Optional)
Create a `.env.local` file in the root directory:
```env
# Optional: Riot API key (not required for DDragon functionality)
RIOT_API_KEY=your_api_key_here

# DDragon API settings (these have sensible defaults)
DDRAGON_BASE_URL=https://ddragon.leagueoflegends.com

# Cache configuration
RIOT_API_CACHE_TTL=3600
```

**Note**: `CURRENT_PATCH` is automatically fetched from DDragon API and no longer needs manual configuration!

### 4. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

**Note**: The project uses Next.js with Turbopack for faster development builds.

## Champion Data System

### Automatic Updates
The application automatically fetches champion data from Riot's DDragon API, which provides:
- Latest champion list
- Champion images
- Current game version information

### Data Flow
1. **First Load**: Fetches champions from DDragon API
2. **Caching**: Stores data locally with version information
3. **Background Updates**: Checks for new versions periodically
4. **Progress Preservation**: Merges your tracking progress with new champion data
5. **Fallback**: Uses local JSON file if API is unavailable

### Storage Strategy
- **Local Storage**: User progress and cached champion data
- **Version Tracking**: Automatically detects when new champions are added
- **Backward Compatibility**: Migrates data from older versions seamlessly

### Manual Refresh
Use the refresh button in the control panel to:
- Force fetch latest champion data
- Update to newest game version
- Sync with recent champion releases

### Import/Export Data
Easily backup and restore your champion progress data:

#### Export
- **One-click download**: Export button downloads a JSON file with your current progress
- **Complete data**: Includes all champion tracking data, game version, and metadata
- **Filename format**: `lol-arena-progress-YYYY-MM-DD.json`
- **Preserves progress**: All played, top 4, and win statuses are saved

#### Import
- **File upload**: Select a JSON file from your device
- **Text paste**: Directly paste JSON content into the import dialog
- **Fast validation**: Real-time validation with clear error messages
- **Retro-compatible**: Import data from older LoL patches seamlessly
- **Safe merging**: Only imports progress for champions that exist in your current data

#### Data Format
The exported JSON includes:
```json
{
  "version": "15.14.1",
  "exportDate": "2025-08-06T12:00:00.000Z",
  "champions": [...],
  "metadata": {
    "totalChampions": 168,
    "appVersion": "1.0.0"
  }
}
```

**Note**: Import is backwards compatible - you can import progress from any previous LoL patch!

## API Endpoints

### `/api/champions`
Returns champion data with automatic DDragon integration:
```json
{
  "champions": [...],
  "version": "15.14.1",
  "source": "ddragon|cache|fallback"
}
```

### `/api/cache` (DELETE)
Clears server-side cache to force fresh data fetch on next request.

### `/api/arena-matches`
Handles Arena match data retrieval and processing.

### `/api/match-history`
Provides match history functionality for tracked champions.

### `/api/riot-account`
Manages Riot account information and validation.

## External APIs Used

The app talks to two Riot-operated services:

- DDragon (static game data, no auth required)
  - Versions: `https://ddragon.leagueoflegends.com/api/versions.json`
  - Champions (per version): `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json`
  - Champion images: `https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{imageKey}.png`
  - Behavior: Latest version is auto-detected at runtime. Requests are cached client-side and server-side to minimize traffic.

- Riot Games API (authenticated, used for match history)
  - Account by Riot ID: `{regionBase}/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`
    - Default region base: `https://americas.api.riotgames.com`
  - Match IDs by PUUID: `{regionBase}/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=20`
  - Match details: `{regionBase}/lol/match/v5/matches/{matchId}`
  - Arena filter: only matches with `info.gameMode === "CHERRY"` are treated as Arena
  - Region selection: the app auto-detects the best regional API (americas, europe, asia, sea) per player and caches that choice.
  - Auth: requires `RIOT_API_KEY` in server environment (not needed for DDragon).
  - Optional: `ARENA_SEASON_START_DATE` can be set (e.g., `2025-08-01`) to filter out older Arena matches.

For implementation details, see `DDRAGON_INTEGRATION.md` and `MATCH_HISTORY_IMPLEMENTATION.md`.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RIOT_API_KEY` | Riot API key (optional for DDragon) | - | No |
| `DDRAGON_BASE_URL` | DDragon API base URL | `https://ddragon.leagueoflegends.com` | No |
| `RIOT_API_CACHE_TTL` | Cache duration in seconds | `3600` | No |
| `ARENA_SEASON_START_DATE` | Optional cutoff date (UTC, YYYY-MM-DD) to filter older Arena matches | - | No |

**Note**: `CURRENT_PATCH` is automatically fetched from DDragon API and no longer needs manual configuration!

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application works on any platform that supports Next.js:

- Netlify
- Railway
- AWS Amplify
- Self-hosted

## Architecture

### Services

- **DDragonService**: Handles API communication with Riot's DDragon
- **ChampionService**: Manages champion data fetching and caching
- **LocalStorageManager**: Handles client-side data persistence

## Browser Storage and Privacy

All user data is stored locally in your browser via `localStorage`. No personal data is persisted on the server.

What is stored locally:

- Champion progress and cached champion list
- The game version the data corresponds to
- Timestamp of last update
- Optional: the last looked-up Riot account (to prefill forms)

Storage keys and schemas:

- `champions` (array) — cached champion list including your progress
  - Champion item shape: `{ id: number, name: string, imageKey: string, checklist: { played: boolean, top4: boolean, win: boolean } }`
- `champions_version` (string) — DDragon version (e.g., `15.15.1`)
- `champions_last_update` (number) — Unix ms timestamp of last successful update
- `last_player` (object) — last selected account for convenience
  - Shape: `{ gameName: string, tagLine: string, puuid: string, region?: string, savedAt: number }`

Update and retention policy:

- Local cache does not expire automatically, but the app checks if data is older than 24 hours and refreshes as needed.
- Server-side champion cache (API route) is refreshed approximately every 1 hour.
- DDragon version lookups are cached for ~10 minutes client-side.

Privacy notes:

- Riot account details (gameName, tagLine, puuid, optional region) are stored only in your browser under `last_player` to streamline future lookups.
- You can remove all locally stored data via the app’s Clear Data controls or by clearing the keys above from your browser storage.
- No cookies are used for this data; `localStorage` is used exclusively.

Data migration and backups:

- Legacy data (older formats) is automatically migrated on load when possible.
- Import/Export lets you backup or restore your progress safely as JSON.

### Components

- **ChampionsGrid**: Main grid display with filtering and tracking
- **ChampionCard**: Individual champion card with progress tracking
- **ControlPanel**: Controls for filtering, refreshing, clearing data, and import/export functionality

### Data Migration

The application automatically handles:

- Legacy data format migration
- Version updates
- Champion additions/removals
- Progress preservation across updates
- Import/export data compatibility across different LoL patches

## Development

### Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── arena-matches/      # Arena match data API
│   │   ├── cache/              # Cache management API
│   │   ├── champions/          # Champion data API
│   │   ├── match-history/      # Match history API
│   │   └── riot-account/       # Riot account API
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout component
│   ├── not-found.tsx           # 404 page
│   └── page.tsx                # Home page
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── ArenaMatchCard.tsx
│   │   ├── CheckboxButton.tsx
│   │   ├── ClearAllButton.tsx
│   │   ├── ColumnSlider.tsx
│   │   ├── ConfirmationModal.tsx
│   │   ├── FilterButtons.tsx
│   │   ├── ImportExportButtons.tsx # Data import/export functionality
│   │   ├── ToggleSwitch.tsx
│   │   └── index.ts
│   ├── ChampionCard.tsx        # Individual champion card
│   ├── ChampionsGrid.tsx       # Main champions grid
│   ├── ControlPanel.tsx        # Control interface
│   ├── Header.tsx              # Application header
│   ├── Footer.tsx              # Application footer
│   ├── MatchHistory.tsx        # Match history display
│   ├── ProgressCounter.tsx     # Progress tracking
│   └── VersionInitializer.tsx  # Version management
├── hooks/
│   ├── useGridColumns.ts       # Grid layout hook
│   └── useVersionInitializer.ts # Version initialization hook
├── lib/
│   ├── constants.ts            # Application constants
│   └── metadata.ts             # Metadata configuration
├── services/
│   ├── championService.ts      # Champion data management
│   ├── ddragon.ts              # DDragon API service
│   └── riotApi.ts              # Riot API service
├── utils/
│   ├── championUtils.ts        # Champion utilities
│   ├── debugUtils.ts           # Debug utilities
│   ├── imageUtils.ts           # Image utilities
│   └── localStorage.ts         # Local storage utilities
└── data/
    └── champions.json          # Fallback champion data
```

### Adding New Features

1. Champion data is automatically updated from DDragon
2. User progress is preserved across all updates
3. Add new tracking fields to the `Champion` interface
4. Update migration logic in `LocalStorageManager`
5. Import/export functionality ensures data portability across updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Technologies Used

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Vercel Analytics** - Usage analytics

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
