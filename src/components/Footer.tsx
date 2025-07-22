import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 bg-gray-900 text-white text-center mt-8">
      <span className="text-sm">&copy; {new Date().getFullYear()} LoL Arena Tracker. All rights reserved.</span>
    </footer>
  );
};

export default Footer;
