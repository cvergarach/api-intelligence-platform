import './globals.css';
import DashboardLayout from '../components/DashboardLayout';

export const metadata = {
  title: 'DATALIVE - Plataforma de Inteligencia de APIs',
  description: 'Plataforma inteligente de análisis y ejecución de APIs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
