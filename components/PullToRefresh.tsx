'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useBaby } from '@/context/BabyContext';
import { RotateCw, ArrowDown, Check, Sparkles } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
}

const PULL_THRESHOLD = 68; // px to trigger refresh
const MAX_PULL = 90;

export function PullToRefresh({ children }: PullToRefreshProps) {
  const { refreshData, isManualRefreshing } = useBaby();

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'done'>('idle');

  const startYRef = useRef(0);
  const isEligibleRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Only allow pull-to-refresh when user is scrolled to the very top
      if (typeof window !== 'undefined' && window.scrollY <= 2 && !isManualRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isEligibleRef.current = true;
      } else {
        isEligibleRef.current = false;
      }
    },
    [isManualRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isEligibleRef.current || isManualRefreshing) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - startYRef.current;

      if (delta > 0 && typeof window !== 'undefined' && window.scrollY <= 2) {
        setIsPulling(true);
        // Exponential dampening for smooth rubber-band resistance
        const dampened = Math.min(MAX_PULL, Math.pow(delta, 0.85) * 1.5);
        setPullDistance(dampened);

        if (dampened >= PULL_THRESHOLD) {
          setRefreshState('ready');
        } else {
          setRefreshState('pulling');
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
        setRefreshState('idle');
      }
    },
    [isManualRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isEligibleRef.current || isManualRefreshing) return;
    isEligibleRef.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshState('refreshing');
      setPullDistance(52); // Keep indicator visible while loading
      try {
        await refreshData();
        setRefreshState('done');
        setTimeout(() => {
          setRefreshState('idle');
          setPullDistance(0);
          setIsPulling(false);
        }, 600);
      } catch {
        setRefreshState('idle');
        setPullDistance(0);
        setIsPulling(false);
      }
    } else {
      setRefreshState('idle');
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [pullDistance, isManualRefreshing, refreshData]);

  // Derive visual indicator values cleanly without reactive cascading state
  const isRefreshing = refreshState === 'refreshing' || isManualRefreshing;
  const effectiveState = isRefreshing ? 'refreshing' : refreshState;
  const effectiveDistance = isRefreshing ? Math.max(pullDistance, 52) : pullDistance;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-screen"
    >
      {/* Pull Indicator Banner */}
      <div
        className="w-full flex items-center justify-center overflow-hidden transition-all duration-200 pointer-events-none z-20"
        style={{
          height: `${effectiveDistance}px`,
          opacity: effectiveDistance > 10 ? Math.min(1, effectiveDistance / 40) : 0,
        }}
      >
        <div className="py-2 px-4 rounded-full bg-white/95 dark:bg-[#1e1e38]/95 border border-rose-300/80 dark:border-emerald-500/40 text-[#4A2034] dark:text-slate-100 shadow-lg flex items-center gap-2 text-xs font-medium backdrop-blur-md">
          {effectiveState === 'pulling' && (
            <>
              <ArrowDown
                className="w-4 h-4 text-rose-500 dark:text-emerald-400 transition-transform duration-150"
                style={{
                  transform: `rotate(${Math.min(180, (pullDistance / PULL_THRESHOLD) * 180)}deg)`,
                }}
              />
              <span className="text-[#7A3B58] dark:text-stone-300">Puxe para atualizar</span>
            </>
          )}

          {effectiveState === 'ready' && (
            <>
              <ArrowDown className="w-4 h-4 text-emerald-300 transform rotate-180 animate-bounce" />
              <span className="text-emerald-300 font-semibold">Solte para atualizar</span>
            </>
          )}

          {effectiveState === 'refreshing' && (
            <>
              <RotateCw className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-emerald-300 font-medium">Atualizando diário...</span>
            </>
          )}

          {effectiveState === 'done' && (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                Tudo atualizado! <Sparkles className="w-3 h-3 text-amber-300 inline" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content with subtle translate down during pull */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance * 0.25}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
