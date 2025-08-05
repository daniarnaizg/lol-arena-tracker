import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found | LoL Arena Tracker',
  description: 'The page you are looking for does not exist. Return to LoL Arena Tracker to continue tracking your Arena mode progress.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Simple header for 404 page */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-xl font-bold text-gray-900">
              LoL Arena Tracker
            </Link>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-8xl font-bold text-gray-900">404</h1>
            <h2 className="text-3xl font-semibold text-gray-700">Page Not Found</h2>
          </div>
          
          <p className="text-gray-600 text-lg leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="space-y-6 pt-4">
            <Link 
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Return to Home
            </Link>
            
            <div className="text-sm text-gray-500">
              <p className="mb-3">Looking for something specific? Try:</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/" className="text-blue-600 hover:underline font-medium">
                  Champion Tracker
                </Link>
                <span className="text-gray-300">•</span>
                <Link href="/" className="text-blue-600 hover:underline font-medium">
                  Match History
                </Link>
                <span className="text-gray-300">•</span>
                <Link href="/" className="text-blue-600 hover:underline font-medium">
                  Progress Stats
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple footer for 404 page */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 LoL Arena Tracker. Track your League of Legends Arena progress.
          </p>
        </div>
      </footer>
    </div>
  );
}
