/* code-figure.ts — Shiki transformer: wraps each fenced code block in <figure class="code"> with a caption bar
 * holding the file name (```ts title="worker/index.ts") or the language, and a copy button that the note page script labels and shows.
 */

import type { Element, ElementContent } from 'hast';
import type { ShikiTransformer } from 'shiki';

const PLAIN = new Set(['', 'plaintext', 'text', 'txt', 'plain']);

export default function codeFigure(): ShikiTransformer {
	return {
		name: 'code-figure',
		root(root) {
			const pre = root.children.find((node): node is Element => node.type === 'element' && node.tagName === 'pre');
			if (!pre) return;
			const meta = this.options.meta?.__raw ?? '';
			const title = /title=(["'])(.*?)\1/.exec(meta)?.[2] ?? (PLAIN.has(this.options.lang) ? '' : this.options.lang);
			const caption: ElementContent[] = [
				{ type: 'element', tagName: 'span', properties: {}, children: title ? [{ type: 'text', value: title }] : [] },
				{ type: 'element', tagName: 'button', properties: { type: 'button', className: ['copy'], hidden: true }, children: [] },
			];
			root.children = [
				{
					type: 'element',
					tagName: 'figure',
					properties: { className: ['code'] },
					children: [{ type: 'element', tagName: 'figcaption', properties: {}, children: caption }, pre],
				},
			];
		},
	};
}
