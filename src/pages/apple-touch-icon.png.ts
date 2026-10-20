import type { APIRoute } from 'astro';
import { spritePng } from '../character/icons';
import { SITE_COLORS } from '../site';

// 180 × 180: the whole character (30 × 30 dots, 6 px each) on the page background. iOS fills transparency with black.
export const GET: APIRoute = () => new Response(spritePng([1, 2, 30, 30], 6, SITE_COLORS.light), { headers: { 'Content-Type': 'image/png' } });
