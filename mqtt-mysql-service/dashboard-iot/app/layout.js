import Providers from './Providers';
import './globals.css';

export const metadata = {
  title: 'Monitor IoT',
  description: 'Dashboard de monitoramento ambiental IoT',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
