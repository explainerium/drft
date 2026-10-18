import { Inter, Manrope } from "next/font/google";

// From the Figma design: Inter for body/UI text, Manrope for headings, prices and the logo.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const fontVariables = `${inter.variable} ${manrope.variable}`;
