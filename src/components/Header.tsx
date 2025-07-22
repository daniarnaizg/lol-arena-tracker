import React from 'react';


interface HeaderProps {
  search: string;
  setSearch: (value: string) => void;
}

const Header = ({ search, setSearch }: HeaderProps) => {
  return (
    <header className="w-full py-6 px-6 bg-gray-900 text-white flex flex-col items-center shadow">
      <h1 className="text-3xl font-bold tracking-tight mb-4 text-center">LoL Arena Tracker</h1>
      <input
        type="text"
        placeholder="Search champions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="rounded px-6 py-4 text-white bg-gray-800 w-full max-w-xl text-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500 text-center placeholder-gray-400"
        autoFocus
      />
    </header>
  );
};

export default Header;
