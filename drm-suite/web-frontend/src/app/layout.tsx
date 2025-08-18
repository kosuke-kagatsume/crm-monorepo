import './global.css';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'DRM Suite - Dandori Relation Management',
  description: '建設業界向け統合管理システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
