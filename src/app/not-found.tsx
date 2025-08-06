"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  const [search, setSearch] = useState('');
  
  return (
    <>
      <Header search={search} setSearch={setSearch} />
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-slate-100">404</h1>
            <h2 className="text-2xl font-semibold text-slate-200">Page Not Found</h2>
          </div>
          
          <p className="text-lg text-slate-300 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="pt-4">
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500"
            >
              ← Back to Arena Tracker
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
