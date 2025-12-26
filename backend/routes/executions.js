import express from 'express';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { prisma } from '../server.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// 1. EJECUTAR ENDPOINT
router.post('/execute/:endpointId', async (req, res) => {
  try {
    const { parameters = {}, modelKey = 'gemini-3-flash-preview' } = req.body;
    
    // Obtener endpoint con su API y credenciales
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: req.params.endpointId },
      include: {
        api: {
          include: {
            credentials: {
              where: { isActive: true }
            },
            document: true
          }
        }
      }
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint no encontrado' });
    }

    // Construir URL completa
    const fullUrl = `${endpoint.api.baseUrl}${endpoint.path}`;
    
    // Preparar headers con autenticación
    const headers = await buildHeaders(endpoint.api);

    // Ejecutar la llamada a la API
    let response;
    let success = true;
    let errorMessage = null;

    try {
      console.log(`Ejecutando: ${endpoint.method} ${fullUrl}`);
      
      const axiosConfig = {
        method: endpoint.method,
        url: fullUrl,
        headers,
        timeout: 30000
      };

      // Agregar parámetros según el método
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        axiosConfig.data = parameters;
      } else if (endpoint.method === 'GET') {
        axiosConfig.params = parameters;
      }

      response = await axios(axiosConfig);
    } catch (error) {
      success = false;
      errorMessage = error.message;
      response = {
        status: error.response?.status || 500,
        data: error.response?.data || { error: error.message }
      };
    }

    // Guardar ejecución en BD
    const execution = await prisma.apiExecution.create({
      data: {
        documentId: endpoint.api.documentId,
        endpointId: endpoint.id,
        parameters,
        response: response.data,
        statusCode: response.status,
        success,
        errorMessage
      }
    });

    // Si la ejecución fue exitosa, generar insights en segundo plano
    if (success) {
      generateInsightsAsync(execution.id, response.data, endpoint, modelKey);
    }

    res.json({
      success,
      execution: {
        id: execution.id,
        statusCode: response.status,
        response: response.data,
        errorMessage
      }
    });
  } catch (error) {
    console.error('Error ejecutando endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. GENERAR PARÁMETROS AUTOMÁTICOS PARA ENDPOINT
router.post('/generate-parameters/:endpointId', async (req, res) => {
  try {
    const { modelKey = 'gemini-3-flash-preview' } = req.body;

    const endpoint = await prisma.endpoint.findUnique({
      where: { id: req.params.endpointId },
      include: {
        api: {
          include: {
            document: true
          }
        }
      }
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint no encontrado' });
    }

    // Construir contexto de la API para la IA
    const apiContext = `
API: ${endpoint.api.name}
URL Base: ${endpoint.api.baseUrl}
Descripción: ${endpoint.api.description || 'No especificada'}
Autenticación: ${endpoint.api.authType}
`;

    const result = await aiService.generateEndpointParameters(
      endpoint,
      apiContext,
      modelKey
    );

    res.json({
      success: true,
      parameters: result.parameters,
      explanation: result.explanation
    });
  } catch (error) {
    console.error('Error generando parámetros:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. LISTAR EJECUCIONES
router.get('/', async (req, res) => {
  try {
    const { documentId, endpointId, limit = 50 } = req.query;
    
    const where = {};
    if (documentId) where.documentId = documentId;
    if (endpointId) where.endpointId = endpointId;

    const executions = await prisma.apiExecution.findMany({
      where,
      include: {
        endpoint: {
          include: {
            api: true
          }
        },
        insights: true
      },
      orderBy: { executedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(executions);
  } catch (error) {
    console.error('Error listando ejecuciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. OBTENER EJECUCIÓN POR ID
router.get('/:id', async (req, res) => {
  try {
    const execution = await prisma.apiExecution.findUnique({
      where: { id: req.params.id },
      include: {
        endpoint: {
          include: {
            api: true
          }
        },
        insights: true
      }
    });

    if (!execution) {
      return res.status(404).json({ error: 'Ejecución no encontrada' });
    }

    res.json(execution);
  } catch (error) {
    console.error('Error obteniendo ejecución:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. EJECUTAR TODOS LOS ENDPOINTS DE UNA API
router.post('/execute-all/:apiId', async (req, res) => {
  try {
    const { modelKey = 'gemini-3-flash-preview' } = req.body;

    const api = await prisma.api.findUnique({
      where: { id: req.params.apiId },
      include: {
        endpoints: true,
        credentials: { where: { isActive: true } }
      }
    });

    if (!api) {
      return res.status(404).json({ error: 'API no encontrada' });
    }

    if (api.endpoints.length === 0) {
      return res.status(400).json({ error: 'La API no tiene endpoints' });
    }

    // Ejecutar endpoints en paralelo (con límite)
    const results = [];
    const batchSize = 5; // Ejecutar 5 a la vez

    for (let i = 0; i < api.endpoints.length; i += batchSize) {
      const batch = api.endpoints.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(endpoint => 
          executeEndpointWithGeneratedParams(endpoint, api, modelKey)
        )
      );

      results.push(...batchResults);
    }

    res.json({
      success: true,
      message: `Ejecutados ${api.endpoints.length} endpoints`,
      results: results.map((r, i) => ({
        endpoint: api.endpoints[i].path,
        status: r.status,
        ...(r.status === 'fulfilled' ? { data: r.value } : { error: r.reason })
      }))
    });
  } catch (error) {
    console.error('Error ejecutando todos los endpoints:', error);
    res.status(500).json({ error: error.message });
  }
});

// FUNCIONES AUXILIARES

async function buildHeaders(api) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'APIIntelligencePlatform/1.0'
  };

  if (api.credentials && api.credentials.length > 0) {
    for (const credential of api.credentials) {
      switch (credential.type) {
        case 'apikey':
          headers[credential.key] = await decryptValue(credential.value);
          break;
        case 'bearer':
          headers['Authorization'] = `Bearer ${await decryptValue(credential.value)}`;
          break;
        case 'basic':
          const basicValue = await decryptValue(credential.value);
          headers['Authorization'] = `Basic ${Buffer.from(basicValue).toString('base64')}`;
          break;
        default:
          headers[credential.key] = await decryptValue(credential.value);
      }
    }
  }

  return headers;
}

async function decryptValue(hashedValue) {
  // En este caso simple, solo devolvemos el valor
  // En producción, usar un sistema de encriptación bidireccional
  return hashedValue;
}

async function generateInsightsAsync(executionId, responseData, endpoint, modelKey) {
  try {
    console.log(`Generando insights para ejecución ${executionId}`);
    
    const result = await aiService.generateInsights(responseData, endpoint, modelKey);
    
    if (result.insights && result.insights.length > 0) {
      for (const insight of result.insights) {
        await prisma.insight.create({
          data: {
            executionId,
            aiModel: modelKey,
            title: insight.title,
            description: insight.description,
            category: insight.category,
            confidence: insight.confidence,
            metadata: {}
          }
        });
      }
      
      console.log(`✅ ${result.insights.length} insights generados`);
    }
  } catch (error) {
    console.error('Error generando insights:', error);
  }
}

async function executeEndpointWithGeneratedParams(endpoint, api, modelKey) {
  // Generar parámetros automáticamente
  const apiContext = `API: ${api.name}\nURL: ${api.baseUrl}`;
  const paramResult = await aiService.generateEndpointParameters(
    endpoint,
    apiContext,
    modelKey
  );

  // Ejecutar con los parámetros generados
  const headers = await buildHeaders(api);
  const fullUrl = `${api.baseUrl}${endpoint.path}`;

  const axiosConfig = {
    method: endpoint.method,
    url: fullUrl,
    headers,
    timeout: 30000
  };

  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    axiosConfig.data = paramResult.parameters;
  } else if (endpoint.method === 'GET') {
    axiosConfig.params = paramResult.parameters;
  }

  const response = await axios(axiosConfig);
  return {
    endpoint: endpoint.path,
    parameters: paramResult.parameters,
    response: response.data
  };
}

export default router;
