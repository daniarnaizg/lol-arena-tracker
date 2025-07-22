import React from 'react';

const Header = () => {
  return (
    <header className="w-full py-4 px-6 bg-gray-900 text-white flex flex-col md:flex-row items-center justify-between shadow">
      <h1 className="text-2xl font-bold tracking-tight mb-2 md:mb-0">LoL Arena Tracker</h1>
      <input
        type="text"
        placeholder="Search champions..."
        className="rounded px-3 py-2 text-black w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled
      />
    </header>
  );
};

export default Header;
