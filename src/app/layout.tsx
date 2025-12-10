import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "./globals.css";
import StyledComponentsRegistry from '@/components/providers/AntdRegistry';
import { SessionProvider } from 'next-auth/react';
export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Lấy messages từ server gửi xuống client
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <StyledComponentsRegistry>
              {children}
            </StyledComponentsRegistry>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}