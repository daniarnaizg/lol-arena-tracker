"use client"
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { BaseButton, MotionWrapper } from './shared';
import {
  IconShare3,
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandReddit,
  IconBrandTelegram,
  IconCopy
} from '@tabler/icons-react';
import { LocalStorageManager } from '@/utils/localStorage';

interface SocialShareProps {
  wins: number;
  total: number;
  className?: string;
}

const useOutsideClick = (ref: React.RefObject<Element>, onOutside: () => void) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside, ref]);
};

export const SocialShare: React.FC<SocialShareProps> = ({ wins, total, className }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef as unknown as React.RefObject<Element>, () => setOpen(false));

  // Fallback: derive progress from localStorage if props aren't ready yet
  const [lsWins, setLsWins] = useState<number>(0);
  const [lsTotal, setLsTotal] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (total > 0) return; // props already have data
    const stored = LocalStorageManager.getChampionData();
    if (stored?.champions) {
      type MiniChampion = { checklist?: { win?: boolean } };
      const list = stored.champions as MiniChampion[];
      const totalCount = list.length;
      const winsCount = list.filter((c) => c?.checklist?.win === true).length;
      setLsTotal(totalCount);
      setLsWins(winsCount);
    }
  }, [total]);

  const finalTotal = total > 0 ? total : lsTotal;
  const finalWins = total > 0 ? wins : lsWins;
  const percentage = finalTotal > 0 ? Math.round((finalWins / finalTotal) * 100) : 0;
  const url = typeof window !== 'undefined' ? window.location.href : 'https://lol-arena-tracker.vercel.app';
  const text = useMemo(
    () => `I've won ${finalWins}/${finalTotal} champions in LoL Arena (${percentage}%) 🏆\nTrack your progress here:`,
    [finalWins, finalTotal, percentage]
  );

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const nav = navigator as Navigator & {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      };
      if (isMobile && nav.share) {
      try {
        await nav.share({
          title: 'LoL Arena Tracker',
          text,
          url
        });
        return true;
      } catch {
        // User cancelled or failed; fall back to menu
        return false;
      }
      }
    }
    return false;
  }, [text, url]);

  const openShareMenu = useCallback(async () => {
    const usedNative = await handleNativeShare();
    if (!usedNative) setOpen((v) => !v);
  }, [handleNativeShare]);

  const shareTargets = useMemo(() => {
    const link = url;
    return [
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        href: `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`,
        color: 'text-green-400',
        icon: <IconBrandWhatsapp size={18} aria-hidden />
      },
      {
        key: 'x',
        label: 'X',
        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
        color: 'text-white',
        icon: <IconBrandX size={18} aria-hidden />
      },
      {
        key: 'reddit',
        label: 'Reddit',
        href: `https://www.reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(text)}`,
        color: 'text-orange-400',
        icon: <IconBrandReddit size={18} aria-hidden />
      },
      {
        key: 'telegram',
        label: 'Telegram',
        href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
        color: 'text-sky-400',
        icon: <IconBrandTelegram size={18} aria-hidden />
      }
    ];
  }, [text, url]);

  const onCopy = async () => {
    const content = `${text} ${url}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setOpen(false);
    } catch {
      // no-op
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ''}`}>
      <BaseButton
        variant="primary"
        size="sm"
        onClick={openShareMenu}
        ariaLabel="Share your progress"
        title="Share your progress"
      >
        <div className="flex items-center gap-2">
          <IconShare3 size={18} aria-hidden />
          <span className="hidden sm:inline">Share</span>
        </div>
      </BaseButton>

      {open && (
        <MotionWrapper config={{ hover: { scale: 1.01 }, tap: { scale: 0.99 } }}>
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-slate-800 border border-slate-700 shadow-lg p-2 z-50">
            <ul className="flex flex-col">
              {shareTargets.map((t) => (
                <li key={t.key}>
                  <a
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 text-gray-200"
                    onClick={() => setOpen(false)}
                  >
                    <span className={t.color}>{t.icon}</span>
                    <span className="text-sm">{t.label}</span>
                  </a>
                </li>
              ))}
              <li>
                <button
                  onClick={onCopy}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700 text-gray-200"
                >
                  <IconCopy size={18} aria-hidden />
                  <span className="text-sm">Copy text + link</span>
                </button>
              </li>
            </ul>
          </div>
        </MotionWrapper>
      )}
    </div>
  );
};

export default SocialShare;
