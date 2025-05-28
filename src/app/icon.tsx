
import { ImageResponse } from 'next/og';
import { VoteIcon } from 'lucide-react';

// Specify the runtime for this route.
export const runtime = 'edge';

// It's good practice to define the content type,
// though Next.js might infer it. ImageResponse defaults to PNG.
export const contentType = 'image/png';
export const size = {
  width: 32,
  height: 32,
};

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          // The icon's color is set directly.
          // No explicit background is set for the div,
          // so it will be transparent by default.
        }}
      >
        <VoteIcon color="#FF8600" size={32} />
      </div>
    ),
    {
      // ImageResponse options:
      width: 32,  // Desired width of the output image
      height: 32, // Desired height of the output image
      // You can also specify fonts if your icon component uses text,
      // but lucide-react icons are SVG paths, so fonts are not needed here.
    }
  );
}

