"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconBrandGithub } from '@tabler/icons-react';

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
              LoL Arena Tracker is a simple web app to follow your League of Legends Arena mode champions, match history, and progress.
            </p>
            <p className="text-gray-300 text-sm">
              Stay updated and improve your performance.
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
                <IconBrandGithub size={20} className="group-hover:scale-110 transition-transform duration-200" aria-hidden />
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
