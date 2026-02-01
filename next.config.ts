import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  // Remove static export to enable middleware and server-side features
  // output: 'export', // Commented out to enable middleware
  trailingSlash: true,
  images: {
    // Remove unoptimized for better performance with server-side rendering
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: false,
    qualities: [25, 50, 75, 90, 100],
  },
  // Configure MDX
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

// Apply MDX then fix turbopack: @next/mdx adds top-level turbopack.conditions
// which Next.js 16 does not accept (condition belongs inside each rule).
let config = withMDX(nextConfig);
if (config.turbopack && 'conditions' in config.turbopack) {
  const turbopack = config.turbopack as Record<string, unknown>;
  const conditions = turbopack.conditions as Record<string, unknown> | undefined;
  const rules = turbopack.rules as Record<string, unknown> | undefined;
  if (conditions && rules && typeof rules['#next-mdx'] === 'object' && rules['#next-mdx'] !== null) {
    const mdxRule = rules['#next-mdx'] as Record<string, unknown>;
    if (conditions['#next-mdx']) {
      mdxRule.condition = conditions['#next-mdx'];
    }
  }
  delete turbopack.conditions;
}
export default config;
