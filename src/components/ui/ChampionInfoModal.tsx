"use client"
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Champion } from '@/services/ddragon';
import { 
  ChampionArenaData, 
  fetchChampionArenaData,
  AugmentItem,
  ItemData
} from '@/services/championDataService';

interface ChampionInfoModalProps {
  isOpen: boolean;
  champion: Champion | null;
  onClose: () => void;
}

// Tier-based styling configurations
const TIER_STYLES = {
  S: { 
    border: 'border-purple-500',
    shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    badge: 'bg-purple-500/20 text-purple-200 border-purple-400'
  },
  A: {
    border: 'border-blue-500',
    shadow: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    badge: 'bg-blue-500/20 text-blue-200 border-blue-400'
  },
  B: {
    border: 'border-green-500',
    shadow: 'shadow-[0_0_6px_rgba(34,197,94,0.5)]',
    badge: 'bg-green-500/20 text-green-200 border-green-400'
  },
  C: {
    border: 'border-yellow-500',
    shadow: 'shadow-[0_0_6px_rgba(234,179,8,0.5)]',
    badge: 'bg-yellow-500/20 text-yellow-200 border-yellow-400'
  },
  D: {
    border: 'border-orange-500',
    shadow: 'shadow-[0_0_6px_rgba(249,115,22,0.5)]',
    badge: 'bg-orange-500/20 text-orange-200 border-orange-400'
  },
  default: {
    border: 'border-red-500',
    shadow: 'shadow-[0_0_6px_rgba(239,68,68,0.5)]',
    badge: 'bg-red-500/20 text-red-200 border-red-400'
  }
}

// Image fallback handler for both items and augments
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, name: string): void => {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
  
  const parent = target.parentElement;
  if (!parent) return;
  
  // Create a fallback element showing the first letter of the item name
  const fallback = document.createElement('div');
  fallback.textContent = name.charAt(0).toUpperCase();
  fallback.className = 'w-full h-full flex items-center justify-center bg-slate-700 text-blue-300 font-bold';
  parent.appendChild(fallback);
};

// Get tier-specific styling
const getTierStyle = (tier?: string) => {
  if (!tier) return null;
  return TIER_STYLES[tier as keyof typeof TIER_STYLES] || TIER_STYLES.default;
};

export const ChampionInfoModal: React.FC<ChampionInfoModalProps> = ({
  isOpen,
  champion,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [arenaData, setArenaData] = useState<ChampionArenaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when modal opens
  useEffect(() => {
    const fetchData = async (championKey: string) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchChampionArenaData(championKey);
        setArenaData(data);
      } catch (err) {
        console.error('Error fetching champion data:', err);
        setError('Failed to load champion data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen && champion?.imageKey) {
      fetchData(champion.imageKey);
    } else if (!isOpen) {
      // Reset data when modal closes
      setArenaData(null);
    }
  }, [isOpen, champion]);

  // Handle escape key and prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Item component with tooltip
  const ItemWithTooltip = ({ item }: { item: ItemData & { tier?: string }, index?: number }) => {
    const tierStyle = item.tier ? 
      getTierStyle(item.tier) : 
      { border: 'border-slate-600', shadow: '' };
    
    return (
      <div 
        className="relative group"
        title={item.name}
      >
        <div className={`
          w-11 h-11 md:w-12 md:h-12 
          relative rounded overflow-hidden bg-slate-800 
          flex items-center justify-center 
          ${!item.tier ? 'border' : 'border-2'} 
          ${tierStyle?.border || 'border-slate-600'} 
          ${tierStyle?.shadow || ''}
          transition-all
        `}>
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 48px, 56px"
            unoptimized
            onError={(e) => handleImageError(e, item.name)}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                        bg-slate-800 text-xs text-white rounded whitespace-nowrap 
                        opacity-0 group-hover:opacity-100 transition-opacity 
                        pointer-events-none z-10 border border-slate-600">
            {item.name}{item.tier ? ` (Tier ${item.tier})` : ''}
          </div>
        </div>
      </div>
    );
  };
  
  // Augment component with name below the icon
  const Augment = ({ item }: { item: AugmentItem, index: number }) => (
    <div 
      className="flex flex-col items-center p-1 rounded w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5" 
    >
      <div className="w-14 h-14 md:w-16 md:h-16 relative rounded overflow-hidden 
                    bg-slate-800 flex items-center justify-center 
                    border border-slate-600 mb-1">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 56px, 64px"
          unoptimized
          onError={(e) => handleImageError(e, item.name)}
        />
      </div>
      <span className="hidden sm:block text-xs text-gray-100 text-center px-1" 
            title={item.name}>
        {item.name}
      </span>
    </div>
  );
  
  // Modal animation variants
  const overlayAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };
  
  const modalAnimation = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  };
  
  // Modal header with champion name and tier badge
  const ModalHeader = ({ 
    champion, 
    tier, 
    onClose 
  }: { 
    champion: Champion, 
    tier?: string, 
    onClose: () => void 
  }) => {
    const tierStyle = getTierStyle(tier);
    
    return (
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-white mx-2" id="champion-modal-title">{champion.name}</h2>
          {tier && (
            <div className={`text-center border rounded-md py-0.5 px-2 text-xs font-bold ${tierStyle?.badge}`}>
              TIER {tier}
            </div>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };
  
  return (
    <AnimatePresence>
      {isOpen && champion && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          {...overlayAnimation}
          onClick={onClose}
        >
          <motion.div 
            ref={modalRef}
            className="bg-slate-700 text-gray-100 rounded-xl shadow-xl max-w-3xl lg:max-w-5xl w-full mx-auto p-3 md:p-4 max-h-[90vh] overflow-y-auto scrollbar-hide"
            {...modalAnimation}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="champion-modal-title"
          >
            <ModalHeader 
              champion={champion} 
              tier={arenaData?.tier} 
              onClose={onClose} 
            />
            
            {/* Modal Content - Champion Arena Info */}
            <div className="text-gray-100 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" 
                       aria-label="Loading"></div>
                  <p className="mt-2 text-sm text-gray-300">Loading champion data...</p>
                </div>
              ) : error ? (
                <div className="bg-red-900/30 text-red-300 p-3 rounded-lg" role="alert">
                  <p>{error}</p>
                </div>
              ) : !arenaData ? (
                <div className="bg-slate-600 p-3 rounded-lg">
                  <p className="italic text-gray-300">No data available for this champion.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  
                  {/* Core and Situational Items Section */}
                  {(arenaData.items?.core?.length > 0 || arenaData.items?.situational?.length > 0) && (
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex flex-wrap gap-3">
                        {/* Core Items */}
                        {arenaData.items?.core?.length > 0 && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-grow">
                            {/* Mobile: Title on top, Desktop: Title on left */}
                            <h3 className="font-semibold text-sm text-white whitespace-nowrap">Commonly Built:</h3>
                            <div className="flex flex-wrap gap-2 justify-start">
                              {arenaData.items.core
                                .filter(item => item && item.name && item.imageUrl)
                                .slice(0, 7) // Limit to 7 items
                                .map((item, index) => <ItemWithTooltip key={`core-${item.name}-${index}`} item={item} index={index} />)}
                            </div>
                          </div>
                        )}

                        {/* Situational Items */}
                        {arenaData.items?.situational?.length > 0 && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-grow mt-2">
                            {/* Mobile: Title on top, Desktop: Title on left */}
                            <h3 className="font-semibold text-sm text-white whitespace-nowrap">Situational:</h3>
                            <div className="flex flex-wrap gap-2 justify-start">
                              {arenaData.items.situational
                                .filter(item => item && item.name && item.imageUrl)
                                .slice(0, 5) // Limit to 5 items
                                .map((item, index) => <ItemWithTooltip key={`situational-${item.name}-${index}`} item={item} index={index} />)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Augments Section - Main section */}
                  {(arenaData.augments?.prismatic?.length > 0 || 
                    arenaData.augments?.gold?.length > 0 || 
                    arenaData.augments?.silver?.length > 0) && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-lg border border-slate-600 shadow-md">
                      <h3 className="text-md font-semibold text-white mb-2 text-center" id="augments-section">Recommended Augments</h3>
                      
                      {/* Prismatic Augments */}
                      {arenaData.augments?.prismatic?.length > 0 && (
                        <div className="mb-3">
                          <div className="bg-slate-800/50 rounded-lg p-2">
                            {/* Mobile view: Title on top */}
                            <h4 className="font-semibold text-sm text-purple-300 pl-1 whitespace-nowrap mb-2 sm:hidden">Prismatic:</h4>
                            
                            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                              {/* Desktop view: Title on the left */}
                              <h4 className="hidden sm:block font-semibold text-sm text-purple-300 pl-1 whitespace-nowrap pt-1 w-20">Prismatic:</h4>
                              <div className="flex flex-wrap justify-between flex-1">
                                {arenaData.augments.prismatic
                                  .filter(item => item && item.name && item.imageUrl)
                                  .map((item, index) => <Augment key={`prismatic-${item.name}-${index}`} item={item} index={index} />)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Gold Augments */}
                      {arenaData.augments?.gold?.length > 0 && (
                        <div className="mb-3">
                          <div className="bg-slate-800/50 rounded-lg p-2">
                            {/* Mobile view: Title on top */}
                            <h4 className="font-semibold text-sm text-yellow-300 pl-1 whitespace-nowrap mb-2 sm:hidden">Gold:</h4>
                            
                            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                              {/* Desktop view: Title on the left */}
                              <h4 className="hidden sm:block font-semibold text-sm text-yellow-300 pl-1 whitespace-nowrap pt-1 w-20">Gold:</h4>
                              <div className="flex flex-wrap justify-between flex-1">
                                {arenaData.augments.gold
                                  .filter(item => item && item.name && item.imageUrl)
                                  .map((item, index) => <Augment key={`gold-${item.name}-${index}`} item={item} index={index} />)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Silver Augments */}
                      {arenaData.augments?.silver?.length > 0 && (
                        <div>
                          <div className="bg-slate-800/50 rounded-lg p-2">
                            {/* Mobile view: Title on top */}
                            <h4 className="font-semibold text-sm text-gray-300 pl-1 whitespace-nowrap mb-2 sm:hidden">Silver:</h4>
                            
                            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                              {/* Desktop view: Title on the left */}
                              <h4 className="hidden sm:block font-semibold text-sm text-gray-300 pl-1 whitespace-nowrap pt-1 w-20">Silver:</h4>
                              <div className="flex flex-wrap justify-between flex-1">
                                {arenaData.augments.silver
                                  .filter(item => item && item.name && item.imageUrl)
                                  .map((item, index) => <Augment key={`silver-${item.name}-${index}`} item={item} index={index} />)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Prismatic Item Tier List */}
                  {arenaData.prismaticItemTierList && arenaData.prismaticItemTierList.length > 0 && (
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <h3 className="font-semibold text-md text-white text-center mb-2" id="prismatic-items-section">
                        Prismatic Items by Tier
                      </h3>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {arenaData.prismaticItemTierList
                          .filter(item => item && item.name && item.imageUrl)
                          .map((item, index) => <ItemWithTooltip key={`prismatic-${item.name}-${index}`} item={item} index={index} />)}
                      </div>
                    </div>
                  )}
                  
                  {/* METAsrc Attribution */}
                  <div className="text-right">
                    <a 
                      href="https://www.metasrc.com/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                      aria-label="Visit METAsrc website"
                    >
                      Powered by METAsrc
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
