/* site.ts — site-wide values, written once */

export const SITE = {
	url: 'https://rim95.dev',
	name: 'rim95dev',
	author: 'rim95dev',
	email: 'rim95dev@gmail.com',
	github: 'https://github.com/rim95dev',
	/** The Contribution Defense wall on the home page, rebuilt daily in the rim95dev/rim95dev profile repository */
	wall: {
		action: 'https://github.com/marketplace/actions/contribution-defense',
		light: 'https://raw.githubusercontent.com/rim95dev/rim95dev/main/dist/defense-light.svg',
		dark: 'https://raw.githubusercontent.com/rim95dev/rim95dev/main/dist/defense-dark.svg',
	},
} as const;

/** Page backgrounds (same as --bg in src/styles/global.css), for theme-color and the touch icon */
export const SITE_COLORS = { light: '#fbfaf7', dark: '#0a0e14' } as const;
