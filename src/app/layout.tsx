import { Sansita, PT_Serif, Mulish } from "next/font/google";
import type { Metadata } from 'next';
import '@/app/globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

const sansita = Sansita({ 
    subsets: ["latin", "latin-ext"],
    variable: "--font-sansita",
    weight: '400'
});

const ptSerif = PT_Serif({ 
    subsets: ["latin", "latin-ext"], 
    variable: "--font-pt-serif",
    weight: ['400', '700'],
    style: ['normal', 'italic']
});

const mulish = Mulish({ 
    subsets: ["latin", "latin-ext"], 
    variable: "--font-mulish",
    weight: ['300', '400', '600', '700']
});

export const metadata: Metadata = {
    title: 'Wilcze Chatki - Domki na Kaszubach',
    description: 'Komfortowe domki z sauną i jacuzzi w Szumlesiu Królewskim',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pl">
            <body className={`${sansita.variable} ${ptSerif.variable} ${mulish.variable}`}>
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}