"use client"
import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    kofiWidgetOverlay: {
      draw: (username: string, options: Record<string, string>) => void;
    };
  }
}

export const KofiOverlayWidget = () => {
  useEffect(() => {
    // Function to initialize the widget
    const initializeWidget = () => {
      if (typeof window !== 'undefined' && window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw('daniarnaizg', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Support me',
          'floating-chat.donateButton.background-color': '#00b9fe',
          'floating-chat.donateButton.text-color': '#fff'
        });
      }
    };

    // Check if script is already loaded
    if (window.kofiWidgetOverlay) {
      initializeWidget();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.kofiWidgetOverlay) {
          initializeWidget();
          clearInterval(checkInterval);
        }
      }, 100);

      // Clear interval after 10 seconds to avoid infinite checking
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  }, []);

  return (
    <Script 
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js" 
      strategy="afterInteractive"
    />
  );
};
