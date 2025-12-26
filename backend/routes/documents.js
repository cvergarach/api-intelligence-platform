import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../server.js';
import documentService from '../services/documentService.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// Configurar multer para subida de archivos
console.log('📁 [MULTER] Configurando almacenamiento de archivos');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    console.log(`📁 [MULTER] Directorio de subida: ${uploadDir}`);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`✅ [MULTER] Directorio creado/verificado: ${uploadDir}`);
      cb(null, uploadDir);
    } catch (error) {
      console.error(`❌ [MULTER] Error creando directorio: ${error.message}`);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log(`📁 [MULTER] Nombre de archivo generado: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50000000 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos PDF'));
  }
});

// 1. SUBIR Y PROCESAR PDF
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  console.log('\n📤 [UPLOAD-PDF] Iniciando subida de PDF');
  try {
    console.log('📤 [UPLOAD-PDF] Verificando archivo...');
    if (!req.file) {
      console.error('❌ [UPLOAD-PDF] No se proporcionó archivo');
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    console.log(`📤 [UPLOAD-PDF] Archivo recibido: ${req.file.originalname}`);
    console.log(`📤 [UPLOAD-PDF] Tamaño: ${req.file.size} bytes`);
    console.log(`📤 [UPLOAD-PDF] Ruta: ${req.file.path}`);

    const { modelKey = 'gemini-3-flash-preview' } = req.body;
    console.log(`📤 [UPLOAD-PDF] Modelo seleccionado: ${modelKey}`);

    // Procesar PDF
    console.log('📄 [UPLOAD-PDF] Procesando contenido del PDF...');
    const pdfData = await documentService.processPDF(req.file.path);
    console.log(`✅ [UPLOAD-PDF] PDF procesado: ${pdfData.pages} páginas, ${pdfData.text.length} caracteres`);

    // Guardar documento en BD
    console.log('💾 [UPLOAD-PDF] Guardando documento en base de datos...');
    const document = await prisma.document.create({
      data: {
        name: req.file.originalname,
        type: 'pdf',
        filePath: req.file.path,
        content: pdfData.text
      }
    });
    console.log(`✅ [UPLOAD-PDF] Documento guardado con ID: ${document.id}`);

    // Analizar con IA en segundo plano
    console.log('🤖 [UPLOAD-PDF] Iniciando análisis de IA en segundo plano...');
    analyzeDocumentAsync(document.id, pdfData.text, modelKey);

    console.log('✅ [UPLOAD-PDF] Respuesta enviada al cliente');
    res.json({
      success: true,
      message: 'PDF subido y en proceso de análisis',
      document: {
        id: document.id,
        name: document.name,
        pages: pdfData.pages,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('❌ [UPLOAD-PDF] Error:', error);
    console.error('❌ [UPLOAD-PDF] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// 2. ANALIZAR URL WEB
router.post('/analyze-web', async (req, res) => {
  try {
    const { url, modelKey = 'gemini-3-flash-preview' } = req.body;

    if (!url || !documentService.isValidUrl(url)) {
      return res.status(400).json({ error: 'URL inválida' });
    }

    console.log('Analizando web:', url);
    const webData = await documentService.processWebPage(url);

    // Guardar documento en BD
    const document = await prisma.document.create({
      data: {
        name: webData.title,
        type: 'web',
        url: url,
        content: webData.text
      }
    });

    // Analizar con IA en segundo plano
    analyzeDocumentAsync(document.id, webData.text, modelKey);

    res.json({
      success: true,
      message: 'Sitio web analizado y en proceso',
      document: {
        id: document.id,
        name: document.name,
        url: url,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Error analizando web:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. LISTAR TODOS LOS DOCUMENTOS
router.get('/', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        apis: {
          include: {
            endpoints: true
          }
        }
      }
    });

    res.json(documents);
  } catch (error) {
    console.error('Error listando documentos:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. OBTENER DOCUMENTO POR ID
router.get('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        apis: {
          include: {
            endpoints: true,
            credentials: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error obteniendo documento:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. ELIMINAR DOCUMENTO
router.delete('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Eliminar archivo físico si existe
    if (document.filePath) {
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.error('Error eliminando archivo:', error);
      }
    }

    // Eliminar de BD (cascade eliminará apis, endpoints, etc.)
    await prisma.document.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Documento eliminado' });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función auxiliar para analizar documento de forma asíncrona
async function analyzeDocumentAsync(documentId, content, modelKey) {
  console.log(`\n🤖 [ASYNC-ANALYSIS] ========================================`);
  console.log(`🤖 [ASYNC-ANALYSIS] Documento ID: ${documentId}`);
  console.log(`🤖 [ASYNC-ANALYSIS] Modelo: ${modelKey}`);
  console.log(`🤖 [ASYNC-ANALYSIS] Longitud contenido: ${content.length} caracteres`);
  console.log(`🤖 [ASYNC-ANALYSIS] ========================================`);

  try {
    console.log(`🤖 [ASYNC-ANALYSIS] Llamando a aiService.analyzeDocument...`);
    const startTime = Date.now();

    const analysis = await aiService.analyzeDocument(content, modelKey);

    const duration = Date.now() - startTime;
    console.log(`✅ [ASYNC-ANALYSIS] Análisis completado en ${duration}ms`);
    console.log(`📊 [ASYNC-ANALYSIS] Resultado:`, JSON.stringify(analysis, null, 2));

    if (!analysis.apis || analysis.apis.length === 0) {
      console.log('⚠️  [ASYNC-ANALYSIS] No se encontraron APIs en el documento');
      return;
    }

    console.log(`📊 [ASYNC-ANALYSIS] ${analysis.apis.length} APIs encontradas`);

    // Guardar APIs y endpoints encontrados
    for (let i = 0; i < analysis.apis.length; i++) {
      const apiData = analysis.apis[i];
      console.log(`\n💾 [ASYNC-ANALYSIS] Guardando API ${i + 1}/${analysis.apis.length}: ${apiData.name}`);
      console.log(`💾 [ASYNC-ANALYSIS] Base URL: ${apiData.baseUrl}`);
      console.log(`💾 [ASYNC-ANALYSIS] Auth Type: ${apiData.authType || 'custom'}`);

      const api = await prisma.api.create({
        data: {
          documentId,
          name: apiData.name,
          baseUrl: apiData.baseUrl,
          description: apiData.description,
          authType: apiData.authType || 'custom'
        }
      });
      console.log(`✅ [ASYNC-ANALYSIS] API guardada con ID: ${api.id}`);

      // Guardar endpoints
      if (apiData.endpoints && apiData.endpoints.length > 0) {
        console.log(`📍 [ASYNC-ANALYSIS] Guardando ${apiData.endpoints.length} endpoints...`);
        for (let j = 0; j < apiData.endpoints.length; j++) {
          const endpointData = apiData.endpoints[j];
          console.log(`📍 [ASYNC-ANALYSIS] Endpoint ${j + 1}: ${endpointData.method} ${endpointData.path}`);

          await prisma.endpoint.create({
            data: {
              apiId: api.id,
              path: endpointData.path,
              method: endpointData.method,
              description: endpointData.description,
              parameters: endpointData.parameters || {},
              responseSchema: {}
            }
          });
        }
        console.log(`✅ [ASYNC-ANALYSIS] ${apiData.endpoints.length} endpoints guardados`);
      } else {
        console.log(`⚠️  [ASYNC-ANALYSIS] No se encontraron endpoints para esta API`);
      }
    }

    console.log(`\n🎉 [ASYNC-ANALYSIS] ========================================`);
    console.log(`🎉 [ASYNC-ANALYSIS] Análisis completado exitosamente`);
    console.log(`🎉 [ASYNC-ANALYSIS] Total APIs: ${analysis.apis.length}`);
    console.log(`🎉 [ASYNC-ANALYSIS] ========================================\n`);
  } catch (error) {
    console.error(`\n❌ [ASYNC-ANALYSIS] ========================================`);
    console.error(`❌ [ASYNC-ANALYSIS] Error en análisis asíncrono`);
    console.error(`❌ [ASYNC-ANALYSIS] Documento ID: ${documentId}`);
    console.error(`❌ [ASYNC-ANALYSIS] Error:`, error);
    console.error(`❌ [ASYNC-ANALYSIS] Stack:`, error.stack);
    console.error(`❌ [ASYNC-ANALYSIS] ========================================\n`);
  }
}

export default router;
