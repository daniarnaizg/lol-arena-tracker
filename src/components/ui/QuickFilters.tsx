import { useState, useEffect, useCallback } from 'react';

interface FilterOptions {
  startDate: number | null;
  endDate: number | null;
  patch: string | null;
  season: number | null;
  limit?: number;
}

interface QuickFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  isLoading: boolean;
  puuid: string;
}

interface MatchMetadata {
  totalMatches: number;
  dateRange: {
    earliest: number;
    latest: number;
    earliestFormatted: string;
    latestFormatted: string;
  } | null;
  availablePatches: string[];
  availableSeasons: number[];
  championsPlayed: number;
}

export function QuickFilters({ onFiltersChange, isLoading, puuid }: QuickFiltersProps) {
  const [metadata, setMetadata] = useState<MatchMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchMetadata = useCallback(async () => {
    setIsLoadingMetadata(true);
    try {
      const response = await fetch('/api/match-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ puuid }),
      });

      if (response.ok) {
        const data = await response.json();
        setMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [puuid]);

  useEffect(() => {
    if (puuid) {
      fetchMetadata();
    }
  }, [puuid, fetchMetadata]);

  const applyFilter = (filterType: string, filters: FilterOptions) => {
    setActiveFilter(filterType);
    onFiltersChange(filters);
  };

  const clearFilters = () => {
    setActiveFilter('all');
    onFiltersChange({
      startDate: null,
      endDate: null,
      patch: null,
      season: null
    });
  };

  if (isLoadingMetadata) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading filters...</span>
      </div>
    );
  }

  if (!metadata || !metadata.dateRange) {
    return null;
  }

  const { availablePatches, availableSeasons } = metadata;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {/* All Matches - no count shown */}
      <button
        onClick={clearFilters}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
          activeFilter === 'all'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
        }`}
        disabled={isLoading}
      >
        All
      </button>

      {/* Current Season */}
      {availableSeasons.length > 0 && (
        <button
          onClick={() => {
            applyFilter('season', {
              startDate: null,
              endDate: null,
              patch: null,
              season: availableSeasons[0]
            });
          }}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeFilter === 'season'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
          }`}
          disabled={isLoading}
        >
          S{availableSeasons[0]}
        </button>
      )}

      {/* Latest Patches - show up to 3 most recent */}
      {availablePatches.slice(0, 3).map((patch, index) => (
        <button
          key={patch}
          onClick={() => {
            applyFilter(`patch-${index}`, {
              startDate: null,
              endDate: null,
              patch: patch,
              season: null
            });
          }}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeFilter === `patch-${index}`
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
          }`}
          disabled={isLoading}
        >
          {patch}
        </button>
      ))}
    </div>
  );
}
