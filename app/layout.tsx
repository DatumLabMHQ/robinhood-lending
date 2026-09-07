import './globals.css';
import { config } from '@/datum.config';
import { Shell } from '@/components/Shell';

export const metadata = { title: config.title, description: config.description };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
