import type { APIRoute } from 'astro';
import { spriteSvg } from '../character/icons';
import { SQUARE } from '../character/sprite';

export const GET: APIRoute = () => new Response(spriteSvg(SQUARE), { headers: { 'Content-Type': 'image/svg+xml' } });
