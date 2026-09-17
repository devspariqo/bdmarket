'use client';

import {
  BadgeCheck, Banknote, Box, Clock, CreditCard, Gift, Globe, Headphones, Heart, Leaf,
  Lock, MapPin, Package, Phone, RotateCcw, ShieldCheck, Sparkles, Star, Tag, ThumbsUp,
  Truck, Users, Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * Icons a landing page may name in a feature list or review.
 *
 * A curated map rather than `import * as Icons from 'lucide-react'`, which would
 * pull the entire library — several hundred kB — into a page whose whole purpose
 * is to load fast for paid traffic.
 *
 * An unknown name falls back to a neutral dot rather than crashing or rendering
 * nothing, because the merchant types these by hand.
 */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  BadgeCheck, Banknote, Box, Clock, CreditCard, Gift, Globe, Headphones, Heart, Leaf,
  Lock, MapPin, Package, Phone, RotateCcw, ShieldCheck, Sparkles, Star, Tag, ThumbsUp,
  Truck, Users, Zap,
};

export default function LandingIcon({ name, className }: { name?: string; className?: string }) {
  const Cmp = ICONS[String(name || '').trim()] || Sparkles;
  return <Cmp className={className} />;
}
