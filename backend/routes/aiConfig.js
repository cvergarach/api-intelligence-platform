import express from 'express';
import aiService from '../services/aiService.js';

const router = express.Router();

// 1. LISTAR TODOS LOS MODELOS DISPONIBLES
router.get('/models', (req, res) => {
  try {
    const models = aiService.getAvailableModels();
    
    // Agrupar por proveedor
    const grouped = {
      gemini: models.filter(m => m.provider === 'gemini'),
      claude: models.filter(m => m.provider === 'claude'),
      openai: models.filter(m => m.provider === 'openai')
    };

    res.json({
      success: true,
      models: grouped,
      total: models.length
    });
  } catch (error) {
    console.error('Error listando modelos:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. OBTENER INFORMACIÓN DE UN MODELO ESPECÍFICO
router.get('/models/:modelKey', (req, res) => {
  try {
    const model = aiService.getModelInfo(req.params.modelKey);
    res.json({
      success: true,
      model: {
        key: req.params.modelKey,
        ...model
      }
    });
  } catch (error) {
    res.status(404).json({ error: 'Modelo no encontrado' });
  }
});

// 3. PROBAR UN MODELO
router.post('/test/:modelKey', async (req, res) => {
  try {
    const { prompt = '¿Cuál es tu nombre y qué puedes hacer?' } = req.body;
    
    const startTime = Date.now();
    const response = await aiService.callAI(req.params.modelKey, prompt);
    const endTime = Date.now();

    res.json({
      success: true,
      model: req.params.modelKey,
      response,
      responseTime: endTime - startTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error probando modelo:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 4. OBTENER MODELOS RECOMENDADOS POR TAREA
router.get('/recommendations/:task', (req, res) => {
  try {
    const { task } = req.params;
    
    const recommendations = {
      'document-analysis': {
        primary: 'gemini-3-flash-preview',
        alternative: 'claude-sonnet-4-5-20250929',
        reason: 'Modelos optimizados para análisis de documentos extensos'
      },
      'parameter-generation': {
        primary: 'gemini-3-pro',
        alternative: 'claude-opus-4-1',
        reason: 'Máxima capacidad de razonamiento para generar parámetros'
      },
      'insight-generation': {
        primary: 'claude-sonnet-4-5-20250929',
        alternative: 'gemini-3-flash-preview',
        reason: 'Excelente para generar insights accionables'
      },
      'report-generation': {
        primary: 'claude-opus-4-1',
        alternative: 'gemini-3-pro',
        reason: 'Mejor para redactar reportes ejecutivos detallados'
      },
      'fast-processing': {
        primary: 'gemini-3-flash-preview',
        alternative: 'claude-haiku-4-5-20251001',
        reason: 'Modelos más rápidos y económicos'
      },
      'deep-analysis': {
        primary: 'gemini-3-deep-think',
        alternative: 'claude-opus-4-1',
        reason: 'Razonamiento profundo sobre problemas complejos'
      }
    };

    if (recommendations[task]) {
      res.json({
        success: true,
        task,
        ...recommendations[task]
      });
    } else {
      res.json({
        success: true,
        task,
        primary: 'gemini-3-flash-preview',
        alternative: 'claude-sonnet-4-5-20250929',
        reason: 'Modelos balanceados para uso general'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. COMPARAR RENDIMIENTO DE MODELOS
router.post('/compare', async (req, res) => {
  try {
    const { 
      models = ['gemini-3-flash-preview', 'claude-sonnet-4-5-20250929'],
      prompt = 'Analiza brevemente: Esta API permite gestionar usuarios'
    } = req.body;

    const results = await Promise.allSettled(
      models.map(async (modelKey) => {
        const startTime = Date.now();
        const response = await aiService.callAI(modelKey, prompt);
        const endTime = Date.now();
        
        return {
          model: modelKey,
          response: response.substring(0, 200) + '...',
          responseTime: endTime - startTime,
          success: true
        };
      })
    );

    res.json({
      success: true,
      prompt,
      results: results.map((r, i) => ({
        model: models[i],
        ...(r.status === 'fulfilled' ? r.value : { 
          success: false, 
          error: r.reason.message 
        })
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
