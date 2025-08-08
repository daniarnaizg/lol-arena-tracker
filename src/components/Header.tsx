import React from 'react';
import SearchBar from './SearchBar';

interface HeaderProps {
  search: string;
  setSearch: (value: string) => void;
}

const Header = ({ search, setSearch }: HeaderProps) => {
  return (
    <header className="w-full py-10 px-6 bg-slate-900 text-white shadow relative">
      <h1 className="text-3xl ml-4 font-bold tracking-tight">Arena Tracker</h1>
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-6">
        <SearchBar search={search} setSearch={setSearch} />
      </div>
    </header>
  );
};

export default Header;
