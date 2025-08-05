"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from '@/components/Header';
import ChampionsGrid from '@/components/ChampionsGrid';
import { MatchHistory } from '@/components/MatchHistory';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

//export const metadata: Metadata = {
//  title: 'LoL Arena Tracker',
//  description: 'Track your LoL Arena champion status',
//};


import React, { useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [search, setSearch] = useState('');
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-100`}>
        <Header search={search} setSearch={setSearch} />
        <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-8">
          <MatchHistory />
          <ChampionsGrid search={search} />
        </div>
        <Footer />
        {children}
      </body>
    </html>
  );
}
