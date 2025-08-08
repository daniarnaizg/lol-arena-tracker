"use client"
import React, { useEffect, useState } from 'react';

/**
 * Floating "Back to Top" button (FAB) that appears after scrolling.
 * - Sits at bottom-right, respecting safe-area insets on mobile.
 * - Uses ▲ symbol inside a circular button.
 * - Subtle hover/tap effects and proper cursor.
 */
export const BackToTopFab: React.FC<{
	threshold?: number; // pixels scrolled before showing
}> = ({ threshold = 250 }) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => {
			const scrolled = window.scrollY || document.documentElement.scrollTop;
			setVisible(scrolled > threshold);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, [threshold]);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<button
			type="button"
			onClick={scrollToTop}
			aria-label="Back to top"
			title="Back to top"
			className={[
				'fixed z-50',
				// Safe-area aware positioning
				'right-[max(1rem,env(safe-area-inset-right))]',
				'bottom-[max(1rem,env(safe-area-inset-bottom))]',
				// Visibility transitions
				'transition-all duration-300',
				visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none',
				// Button look: circular, subtle shadow, hover/tap
				'w-11 h-11 sm:w-12 sm:h-12 rounded-full',
				'bg-slate-700 backdrop-blur border-2 border-gray-100 shadow-md',
				'text-gray-100 text-base sm:text-lg',
				'flex items-center justify-center',
				'hover:shadow-lg hover:bg-slate-600 hover:border-slate-600 cursor-pointer',
				'active:scale-95',
			].join(' ')}
		>
			▲
		</button>
	);
};

