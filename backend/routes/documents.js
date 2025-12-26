import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../server.js';
import documentService from '../services/documentService.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const { modelKey = 'gemini-3-flash-preview' } = req.body;

    // Procesar PDF
    console.log('Procesando PDF:', req.file.filename);
    const pdfData = await documentService.processPDF(req.file.path);

    // Guardar documento en BD
    const document = await prisma.document.create({
      data: {
        name: req.file.originalname,
        type: 'pdf',
        filePath: req.file.path,
        content: pdfData.text
      }
    });

    // Analizar con IA en segundo plano
    analyzeDocumentAsync(document.id, pdfData.text, modelKey);

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
    console.error('Error subiendo PDF:', error);
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
  try {
    console.log(`Iniciando análisis de documento ${documentId} con modelo ${modelKey}`);
    
    const analysis = await aiService.analyzeDocument(content, modelKey);
    
    if (!analysis.apis || analysis.apis.length === 0) {
      console.log('No se encontraron APIs en el documento');
      return;
    }

    // Guardar APIs y endpoints encontrados
    for (const apiData of analysis.apis) {
      const api = await prisma.api.create({
        data: {
          documentId,
          name: apiData.name,
          baseUrl: apiData.baseUrl,
          description: apiData.description,
          authType: apiData.authType || 'custom'
        }
      });

      // Guardar endpoints
      if (apiData.endpoints && apiData.endpoints.length > 0) {
        for (const endpointData of apiData.endpoints) {
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
      }
    }

    console.log(`✅ Análisis completado: ${analysis.apis.length} APIs encontradas`);
  } catch (error) {
    console.error('Error en análisis asíncrono:', error);
  }
}

export default router;
