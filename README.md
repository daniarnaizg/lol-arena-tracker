# LoL Arena Tracker

Track your LEdit `.env.local` with your settings:
```env
# Optional: Riot API key (not r| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RIOT_API_KEY` | Riot API key (optional for DDragon) | - | No |
| `DDRAGON_BASE_URL` | DDragon API base URL | `https://ddragon.leagueoflegends.com` | No |
| `RIOT_API_CACHE_TTL` | Cache duration in seconds | `3600` | No |

**Note**: `CURRENT_PATCH` is automatically fetched from DDragon API and no longer needs manual configuration!d for DDragon)
RIOT_API_KEY=your_api_key_here

# DDragon API settings (these have sensible defaults)
DDRAGON_BASE_URL=https://ddragon.leagueoflegends.com
# CURRENT_PATCH is auto-fetched from DDragon API

# Cache configuration
RIOT_API_CACHE_TTL=3600
```ends Arena champion progress with automatic updates from DDragon API.

## Features

- **Automatic Champion Updates**: Fetches the latest champion data from Riot's DDragon API
- **Progress Preservation**: Your tracking progress is automatically preserved when new champions are added
- **Offline Fallback**: Works even when the API is unavailable using cached data
- **Real-time Sync**: Automatically updates with new champion releases
- **Manual Refresh**: Force update champion data with the refresh button

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
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

### 3. Environment Setup
Copy the example environment file and configure it:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:
```env
# Optional: Riot API key (not required for DDragon)
RIOT_API_KEY=your_api_key_here

# DDragon API settings (these have sensible defaults)
DDRAGON_BASE_URL=https://ddragon.leagueoflegends.com
CURRENT_PATCH=15.14.1

# Cache configuration
RIOT_API_CACHE_TTL=3600
```

### 4. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

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

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RIOT_API_KEY` | Riot API key (optional for DDragon) | - | No |
| `DDRAGON_BASE_URL` | DDragon API base URL | `https://ddragon.leagueoflegends.com` | No |
| `CURRENT_PATCH` | Current LoL patch version | `15.14.1` | No |
| `RIOT_API_CACHE_TTL` | Cache duration in seconds | `3600` | No |

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
│   ├── api/champions/          # Champion data API
│   └── api/cache/              # Cache management API
├── components/
│   ├── ui/                     # Reusable UI components
│   └── *.tsx                   # Main components
├── services/
│   ├── ddragon.ts              # DDragon API service
│   ├── championService.ts      # Champion data management
│   └── *.ts                    # Other services
├── utils/
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

[Your License Here]

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
