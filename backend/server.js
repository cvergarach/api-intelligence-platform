import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import documentRoutes from './routes/documents.js';
import apiRoutes from './routes/apis.js';
import executionRoutes from './routes/executions.js';
import insightRoutes from './routes/insights.js';
import reportRoutes from './routes/reports.js';
import aiConfigRoutes from './routes/aiConfig.js';

dotenv.config();

console.log('🚀 [STARTUP] Iniciando servidor...');
console.log('📝 [CONFIG] Variables de entorno cargadas');
console.log(`📝 [CONFIG] PORT: ${process.env.PORT || 8000}`);
console.log(`📝 [CONFIG] FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`📝 [CONFIG] DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`📝 [CONFIG] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`📝 [CONFIG] CLAUDE_API_KEY: ${process.env.CLAUDE_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);

const app = express();
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
const PORT = process.env.PORT || 8000;

// Middleware de logging para todas las requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`📍 [REQUEST] Origin: ${req.get('origin') || 'No origin'}`);
  console.log(`📍 [REQUEST] User-Agent: ${req.get('user-agent')}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`📍 [REQUEST] Query:`, req.query);
  }
  if (req.body && Object.keys(req.body).length > 0 && req.body.constructor === Object) {
    console.log(`📍 [REQUEST] Body keys:`, Object.keys(req.body));
  }

  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`📤 [RESPONSE] ${req.method} ${req.path} - Status: ${res.statusCode}`);
    originalSend.call(this, data);
  };

  next();
});

// Middleware
// Remove trailing slash from FRONTEND_URL to avoid CORS issues
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
console.log(`🔒 [CORS] Configurado para: ${frontendUrl}`);

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('✅ [MIDDLEWARE] Middleware configurado');

// Health check
app.get('/health', (req, res) => {
  console.log('💚 [HEALTH] Health check solicitado');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API Intelligence Platform - Backend funcionando correctamente'
  });
});

// Routes
console.log('🛣️  [ROUTES] Registrando rutas...');
app.use('/api/documents', documentRoutes);
console.log('✅ [ROUTES] /api/documents registrada');
app.use('/api/apis', apiRoutes);
console.log('✅ [ROUTES] /api/apis registrada');
app.use('/api/executions', executionRoutes);
console.log('✅ [ROUTES] /api/executions registrada');
app.use('/api/insights', insightRoutes);
console.log('✅ [ROUTES] /api/insights registrada');
app.use('/api/reports', reportRoutes);
console.log('✅ [ROUTES] /api/reports registrada');
app.use('/api/ai-config', aiConfigRoutes);
console.log('✅ [ROUTES] /api/ai-config registrada');

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ [ERROR] Error capturado:', err);
  console.error('❌ [ERROR] Stack:', err.stack);
  console.error('❌ [ERROR] Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  [404] Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    console.log('🔌 [DATABASE] Conectando a la base de datos...');
    await prisma.$connect();
    console.log('✅ [DATABASE] Base de datos conectada exitosamente');

    // Verificar que las tablas existen
    try {
      const count = await prisma.document.count();
      console.log(`📊 [DATABASE] Tabla Document verificada - ${count} registros`);
    } catch (error) {
      console.error('❌ [DATABASE] Error verificando tabla Document:', error.message);
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error conectando a la base de datos:', error);
    console.error('❌ [DATABASE] Stack:', error.stack);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  [SHUTDOWN] Señal SIGINT recibida, cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ [SHUTDOWN] Base de datos desconectada');
  process.exit(0);
});

export { prisma };
