# LoL Arena Tracker

Track your League of Legends Arena champion progress with automatic updates from DDragon API.

## Features

- **Automatic Champion Updates**: Fetches the latest champion data from Riot's DDragon API
- **Progress Preservation**: Your tracking progress is automatically preserved when new champions are added
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

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RIOT_API_KEY` | Riot API key (optional for DDragon) | - | No |
| `DDRAGON_BASE_URL` | DDragon API base URL | `https://ddragon.leagueoflegends.com` | No |
| `RIOT_API_CACHE_TTL` | Cache duration in seconds | `3600` | No |

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

### Components
- **ChampionsGrid**: Main grid display with filtering and tracking
- **ChampionCard**: Individual champion card with progress tracking
- **ControlPanel**: Controls for filtering, refreshing, and clearing data

### Data Migration
The application automatically handles:
- Legacy data format migration
- Version updates
- Champion additions/removals
- Progress preservation across updates

## Development

### Project Structure
```
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
