import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                'neon-cyan': 'var(--neon-cyan)',
                'neon-emerald': 'var(--neon-emerald)',
            },
            animation: {
                fadeIn: 'fadeIn 0.5s ease-out forwards',
            },
        },
    },
    plugins: [],
};
export default config;
