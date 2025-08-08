"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8">
          
          {/* Project Info */}
          <div className="text-center md:text-left flex-shrink-0">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">LoL Arena Tracker</h3>
            <p className="text-gray-300 text-sm">
              Track your League of Legends Arena mode champions and progress
            </p>
          </div>

          {/* Legal/Disclaimer */}
          <div className="text-center md:text-right flex-shrink-0">
            <p className="text-xs text-gray-400 leading-relaxed">
              League of Legends © Riot Games, Inc.<br/>
              This project is not affiliated with Riot Games.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {/* GitHub Link */}
              <Link 
                href="https://github.com/daniarnaizg/lol-arena-tracker" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200 group"
                title="View on GitHub"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
              </Link>

              {/* Ko-fi Support - Real Logo */}
              <Link 
                href="https://ko-fi.com/S6S41J9POL" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity duration-200 group"
                title="Support on Ko-fi"
              >
                <Image 
                  src="/kofi_symbol.svg"
                  alt="Ko-fi"
                  width={20}
                  height={20}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-400">
              &copy; {currentYear} LoL Arena Tracker. Made with ❤️ for the League community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
