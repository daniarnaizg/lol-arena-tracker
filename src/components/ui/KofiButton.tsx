"use client"
import React from 'react';
import Image from 'next/image';

export const KofiButton: React.FC = () => {
  const handleKofiClick = () => {
    window.open('https://ko-fi.com/S6S41J9POL', '_blank');
  };

  return (
    <button
      onClick={handleKofiClick}
      className="hover:opacity-80 transition-opacity duration-200 w-full sm:w-auto"
      title="Buy Me a Coffee at ko-fi.com"
    >
      <div className="inline-block">
        <Image 
          height={36} 
          width={143} // Ko-fi button typical width
          src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" 
          alt="Buy Me a Coffee at ko-fi.com"
          className="block border-0 max-w-full h-auto"
          priority
        />
      </div>
    </button>
  );
};
