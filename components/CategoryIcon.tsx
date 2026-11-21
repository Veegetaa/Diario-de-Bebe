'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { StickyNote, HelpCircle, Pill, Syringe } from 'lucide-react';

export type CategoryType = 'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota' | 'remedio' | 'vacina' | string;

export const CATEGORY_ICONS: Record<string, { src: string; alt: string; cdnUrl: string }> = {
  peito: {
    src: '/icons/peito.png',
    cdnUrl: 'https://cdn-icons-png.flaticon.com/512/1754/1754261.png',
    alt: 'Ícone de amamentação / peito',
  },
  mamadeira: {
    src: '/icons/mamadeira.png',
    cdnUrl: 'https://cdn-icons-png.flaticon.com/512/405/405131.png',
    alt: 'Ícone de mamadeira',
  },
  sono: {
    src: '/icons/sono.png',
    cdnUrl: 'https://png.pngtree.com/png-vector/20240923/ourmid/pngtree-baby-sleep-png-image_13891098.png',
    alt: 'Ícone de sono do bebê dormindo',
  },
  fralda: {
    src: '/icons/fralda.png',
    cdnUrl: 'https://cdn-icons-png.flaticon.com/512/7055/7055680.png',
    alt: 'Ícone de fralda',
  },
};

interface CategoryIconProps {
  category: CategoryType;
  size?: number;
  className?: string;
  useCdnDirectly?: boolean;
}

export function CategoryIcon({
  category,
  size = 24,
  className = '',
  useCdnDirectly = false,
}: CategoryIconProps) {
  const normalized = category.toLowerCase().trim();
  const iconData = CATEGORY_ICONS[normalized];
  const [imageError, setImageError] = useState(false);

  if (iconData) {
    const targetSrc = (useCdnDirectly && !imageError) ? iconData.cdnUrl : iconData.src;

    return (
      <Image
        src={imageError ? iconData.src : targetSrc}
        alt={iconData.alt}
        width={size}
        height={size}
        className={`object-contain select-none pointer-events-none drop-shadow-2xs ${className}`}
        referrerPolicy="no-referrer"
        priority={size >= 28}
        onError={() => setImageError(true)}
      />
    );
  }

  if (normalized === 'nota') {
    return <StickyNote style={{ width: size, height: size }} className={className} />;
  }

  if (normalized === 'remedio') {
    return <Pill style={{ width: size, height: size }} className={`text-cyan-400 ${className}`} />;
  }

  if (normalized === 'vacina') {
    return <Syringe style={{ width: size, height: size }} className={`text-violet-400 ${className}`} />;
  }

  return <HelpCircle style={{ width: size, height: size }} className={className} />;
}
