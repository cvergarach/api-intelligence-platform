import './globals.css';

export const metadata = {
  title: 'API Intelligence Platform',
  description: 'Plataforma inteligente de análisis y ejecución de APIs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
