import React from 'react';
import { IconSearch } from '@tabler/icons-react';

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
}

const SearchBar = ({ search, setSearch }: SearchBarProps) => {
  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
        <IconSearch size={24} stroke={2} aria-hidden />
      </div>
      <input
        type="text"
        placeholder="Search champions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="rounded px-6 py-4 pl-14 text-white bg-slate-800 w-full text-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500 text-center placeholder-gray-400"
        autoFocus
      />
    </div>
  );
};

export default SearchBar;
