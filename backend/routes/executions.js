import express from 'express';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { prisma } from '../server.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// 1. EJECUTAR ENDPOINT
router.post('/execute/:endpointId', async (req, res) => {
  console.log(`\n🚀 [EXECUTE] ========================================`);
  console.log(`🚀 [EXECUTE] Endpoint ID: ${req.params.endpointId}`);

  try {
    const { parameters = {}, modelKey = 'gemini-3-flash-preview' } = req.body;
    console.log(`🚀 [EXECUTE] Parámetros recibidos:`, parameters);
    console.log(`🚀 [EXECUTE] Modelo IA: ${modelKey}`);

    // Obtener endpoint con su API y credenciales
    console.log(`💾 [EXECUTE] Buscando endpoint en base de datos...`);
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
      console.error(`❌ [EXECUTE] Endpoint no encontrado: ${req.params.endpointId}`);
      return res.status(404).json({ error: 'Endpoint no encontrado' });
    }

    console.log(`✅ [EXECUTE] Endpoint encontrado: ${endpoint.method} ${endpoint.path}`);
    console.log(`📊 [EXECUTE] API: ${endpoint.api.name}`);
    console.log(`📊 [EXECUTE] Base URL: ${endpoint.api.baseUrl}`);
    console.log(`📊 [EXECUTE] Auth Type: ${endpoint.api.authType}`);
    console.log(`📊 [EXECUTE] Credenciales activas: ${endpoint.api.credentials.length}`);

    // Construir URL completa
    const fullUrl = `${endpoint.api.baseUrl}${endpoint.path}`;
    console.log(`🎯 [EXECUTE] URL completa: ${fullUrl}`);

    // Preparar headers con autenticación
    console.log(`🔑 [EXECUTE] Construyendo headers...`);
    const headers = await buildHeaders(endpoint.api);
    console.log(`🔑 [EXECUTE] Headers:`, headers);

    // Ejecutar la llamada a la API
    let response;
    let success = true;
    let errorMessage = null;

    try {
      console.log(`\n📡 [EXECUTE] ========================================`);
      console.log(`📡 [EXECUTE] Ejecutando llamada HTTP...`);
      console.log(`📡 [EXECUTE] Método: ${endpoint.method}`);
      console.log(`📡 [EXECUTE] URL: ${fullUrl}`);

      const axiosConfig = {
        method: endpoint.method,
        url: fullUrl,
        headers,
        timeout: 30000
      };

      // Agregar parámetros según el método
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        axiosConfig.data = parameters;
        console.log(`📡 [EXECUTE] Body:`, parameters);
      } else if (endpoint.method === 'GET') {
        axiosConfig.params = parameters;
        console.log(`📡 [EXECUTE] Query params:`, parameters);
      }

      const startTime = Date.now();
      response = await axios(axiosConfig);
      const duration = Date.now() - startTime;

      console.log(`\n✅ [EXECUTE] ========================================`);
      console.log(`✅ [EXECUTE] Respuesta exitosa en ${duration}ms`);
      console.log(`✅ [EXECUTE] Status: ${response.status}`);
      console.log(`✅ [EXECUTE] Headers:`, response.headers);
      console.log(`✅ [EXECUTE] Data type: ${typeof response.data}`);
      console.log(`✅ [EXECUTE] Data:`, JSON.stringify(response.data, null, 2));
      console.log(`✅ [EXECUTE] ========================================\n`);

    } catch (error) {
      success = false;
      errorMessage = error.message;

      console.error(`\n❌ [EXECUTE] ========================================`);
      console.error(`❌ [EXECUTE] Error en llamada HTTP`);
      console.error(`❌ [EXECUTE] Error message: ${error.message}`);
      console.error(`❌ [EXECUTE] Error code: ${error.code}`);
      console.error(`❌ [EXECUTE] Response status: ${error.response?.status}`);
      console.error(`❌ [EXECUTE] Response data:`, error.response?.data);
      console.error(`❌ [EXECUTE] Stack:`, error.stack);
      console.error(`❌ [EXECUTE] ========================================\n`);

      response = {
        status: error.response?.status || 500,
        data: error.response?.data || { error: error.message }
      };
    }

    // Guardar ejecución en BD
    console.log(`💾 [EXECUTE] Guardando ejecución en base de datos...`);
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
    console.log(`✅ [EXECUTE] Ejecución guardada con ID: ${execution.id}`);

    // Si la ejecución fue exitosa, generar insights en segundo plano
    if (success) {
      console.log(`🤖 [EXECUTE] Iniciando generación de insights en segundo plano...`);
      generateInsightsAsync(execution.id, response.data, endpoint, modelKey);
    } else {
      console.log(`⚠️  [EXECUTE] No se generarán insights debido al error`);
    }

    console.log(`\n🎉 [EXECUTE] ========================================`);
    console.log(`🎉 [EXECUTE] Ejecución completada`);
    console.log(`🎉 [EXECUTE] Success: ${success}`);
    console.log(`🎉 [EXECUTE] Status Code: ${response.status}`);
    console.log(`🎉 [EXECUTE] ========================================\n`);

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
    console.error(`\n❌ [EXECUTE] ========================================`);
    console.error(`❌ [EXECUTE] Error fatal en ejecución`);
    console.error(`❌ [EXECUTE] Error:`, error);
    console.error(`❌ [EXECUTE] Stack:`, error.stack);
    console.error(`❌ [EXECUTE] ========================================\n`);
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
  console.log(`\n🧠 [INSIGHTS] ========================================`);
  console.log(`🧠 [INSIGHTS] Generando insights para ejecución ${executionId}`);
  console.log(`🧠 [INSIGHTS] Modelo: ${modelKey}`);
  console.log(`🧠 [INSIGHTS] Endpoint: ${endpoint.method} ${endpoint.path}`);

  try {
    console.log(`🧠 [INSIGHTS] Llamando a aiService.generateInsights...`);
    const startTime = Date.now();

    const result = await aiService.generateInsights(responseData, endpoint, modelKey);

    const duration = Date.now() - startTime;
    console.log(`✅ [INSIGHTS] Insights generados en ${duration}ms`);
    console.log(`🧠 [INSIGHTS] Resultado:`, JSON.stringify(result, null, 2));

    if (result.insights && result.insights.length > 0) {
      console.log(`🧠 [INSIGHTS] Guardando ${result.insights.length} insights...`);

      for (let i = 0; i < result.insights.length; i++) {
        const insight = result.insights[i];
        console.log(`🧠 [INSIGHTS] Insight ${i + 1}: ${insight.title}`);

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

      console.log(`✅ [INSIGHTS] ${result.insights.length} insights guardados`);
    } else {
      console.log(`⚠️  [INSIGHTS] No se generaron insights`);
    }

    console.log(`🧠 [INSIGHTS] ========================================\n`);
  } catch (error) {
    console.error(`\n❌ [INSIGHTS] ========================================`);
    console.error(`❌ [INSIGHTS] Error generando insights`);
    console.error(`❌ [INSIGHTS] Ejecución ID: ${executionId}`);
    console.error(`❌ [INSIGHTS] Error:`, error);
    console.error(`❌ [INSIGHTS] Stack:`, error.stack);
    console.error(`❌ [INSIGHTS] ========================================\n`);
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
