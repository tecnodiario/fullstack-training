import type { Config } from "tailwindcss";

/**
 * Tailwind: scansiona app/ e components/ per generare le classi usate.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: []
} satisfies Config;
