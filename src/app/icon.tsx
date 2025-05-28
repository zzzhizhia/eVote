
import { VoteIcon } from 'lucide-react';

// It's common to use a fixed size for favicons.
// Next.js recommends 32x32 or 16x16 for favicons from app/icon.tsx.
// Let's use a size that is generally good for favicons.
const iconSize = 32;

export default function Icon() {
  // For favicons generated from an SVG component, it's often best to use explicit fill/stroke colors
  // rather than relying on CSS variables, as the browser might fetch/render the SVG
  // in a context where application CSS (like Tailwind variables) isn't available.
  // The primary color --primary is HSL(32 100% 50%), which is #FF8600.
  return <VoteIcon color="#FF8600" size={iconSize} />;
}
