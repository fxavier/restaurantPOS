import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import GlobalClientEffects from '@/components/GlobalClientEffects';

import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Sistema de Gestão de Restaurante - POS',
	description:
		'Sistema completo de gestão de restaurante com POS, KDS, inventário e relatórios financeiros',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const content = (
		<>
			{children}
			<Toaster />
			<SonnerToaster />
			<GlobalClientEffects />
		</>
	);

	return (
		<html lang='pt-BR' suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange
				>
					{content}
				</ThemeProvider>
			</body>
		</html>
	);
}
