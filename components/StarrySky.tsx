'use client';

import React, { useMemo } from 'react';
import { useBaby } from '@/context/BabyContext';

export function StarrySky() {
  const { effectiveTheme } = useBaby();

  // Generate static random positions for stars so they don't jump around on re-renders
  const stars = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${(i * 17 + 7) % 96}%`,
      top: `${(i * 23 + 11) % 92}%`,
      size: (i % 3) + 1.5,
      delay: `${(i * 0.4) % 3.5}s`,
      duration: `${2 + (i % 3)}s`,
      opacity: 0.3 + ((i % 5) * 0.15),
    }));
  }, []);

  if (effectiveTheme !== 'dark') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Twinkling ambient stars */}
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white dark:bg-indigo-100 animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: star.delay,
            animationDuration: star.duration,
            boxShadow: star.size > 2 ? '0 0 4px rgba(255, 255, 255, 0.8)' : 'none',
          }}
        />
      ))}

      {/* Shooting stars (Estrelas cadentes) */}
      <div className="shooting-star shooting-star-1" />
      <div className="shooting-star shooting-star-2" />
      <div className="shooting-star shooting-star-3" />

      <style jsx>{`
        .shooting-star {
          position: absolute;
          height: 2px;
          background: linear-gradient(-45deg, rgba(255, 255, 255, 1), rgba(199, 210, 254, 0.8), transparent);
          border-radius: 999px;
          filter: drop-shadow(0 0 6px rgba(199, 210, 254, 0.8));
          opacity: 0;
          pointer-events: none;
        }

        .shooting-star-1 {
          top: 12%;
          left: 85%;
          width: 90px;
          animation: shoot1 8s ease-in-out infinite;
          animation-delay: 1.5s;
        }

        .shooting-star-2 {
          top: 28%;
          left: 92%;
          width: 120px;
          animation: shoot2 11s ease-in-out infinite;
          animation-delay: 5s;
        }

        .shooting-star-3 {
          top: 45%;
          left: 80%;
          width: 75px;
          animation: shoot3 9.5s ease-in-out infinite;
          animation-delay: 8s;
        }

        @keyframes shoot1 {
          0% {
            transform: translateX(0) translateY(0) rotate(-35deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          15% {
            transform: translateX(-400px) translateY(240px) rotate(-35deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes shoot2 {
          0% {
            transform: translateX(0) translateY(0) rotate(-40deg);
            opacity: 0;
          }
          4% {
            opacity: 0.9;
          }
          12% {
            transform: translateX(-450px) translateY(320px) rotate(-40deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes shoot3 {
          0% {
            transform: translateX(0) translateY(0) rotate(-32deg);
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          16% {
            transform: translateX(-350px) translateY(200px) rotate(-32deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
