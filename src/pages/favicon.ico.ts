import type { APIRoute } from 'astro';
import { pngIco, spritePng } from '../character/icons';
import { SQUARE } from '../character/sprite';

// For clients that only look at /favicon.ico; browsers use favicon.svg
export const GET: APIRoute = () => new Response(pngIco(spritePng(SQUARE, 2), SQUARE[2] * 2), { headers: { 'Content-Type': 'image/x-icon' } });
