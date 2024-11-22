/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	prefix: "",
	theme: {
		extend: {
			colors: {
				c0: {
					DEFAULT: "hsl(var(--important))",
					accent: "hsl(var(--important-accent))"
				},
				c1: {
					DEFAULT: "hsl(var(--primary))",
					fill: "hsl(var(--primary-fill))",
					accent: "hsl(var(--primary-accent))"
				},
				c2: {
					DEFAULT: "hsl(var(--secondary))",
					fill: "hsl(var(--secondary-fill))",
					accent: "hsl(var(--secondary-accent))"
				},
				c3: {
					DEFAULT: "hsl(var(--tertiary))",
					fill: "hsl(var(--tertiary-fill))",
					accent: "hsl(var(--tertiary-accent))"
				},
			},
			borderRadius: {
				DEFAULT: "8px",
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
	],
}
