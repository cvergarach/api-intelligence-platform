import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// MODELOS VIGENTES A DICIEMBRE 2025
export const AI_MODELS = {
  gemini: {
    'gemini-3-flash-preview': {
      name: 'Gemini 3 Flash Preview',
      description: 'Más reciente (17 dic 2025), velocidad y eficiencia',
      provider: 'gemini'
    },
    'gemini-3-pro': {
      name: 'Gemini 3 Pro',
      description: 'Máxima capacidad de razonamiento',
      provider: 'gemini'
    },
    'gemini-3-deep-think': {
      name: 'Gemini 3 Deep Think',
      description: 'Razonamiento profundo sobre problemas complejos',
      provider: 'gemini'
    },
    'gemini-2.5-pro': {
      name: 'Gemini 2.5 Pro',
      description: 'Modelo estable para producción',
      provider: 'gemini'
    },
    'gemini-2.5-flash': {
      name: 'Gemini 2.5 Flash',
      description: 'Balance precio-rendimiento',
      provider: 'gemini'
    },
    'gemini-2.5-flash-lite': {
      name: 'Gemini 2.5 Flash Lite',
      description: 'Optimizado para costo y throughput',
      provider: 'gemini'
    }
  },
  claude: {
    'claude-sonnet-4-5-20250929': {
      name: 'Claude Sonnet 4.5',
      description: 'Más inteligente y eficiente para uso diario',
      provider: 'claude'
    },
    'claude-haiku-4-5-20251001': {
      name: 'Claude Haiku 4.5',
      description: 'Ultra rápido y económico',
      provider: 'claude'
    },
    'claude-opus-4-1': {
      name: 'Claude Opus 4.1',
      description: 'Máxima capacidad de análisis',
      provider: 'claude'
    }
  },
  openai: {
    'gpt-5.2': {
      name: 'GPT-5.2',
      description: 'Más reciente de OpenAI (11 dic 2025)',
      provider: 'openai'
    },
    'gpt-4-turbo': {
      name: 'GPT-4 Turbo',
      description: 'Velocidad y precisión',
      provider: 'openai'
    },
    'gpt-4': {
      name: 'GPT-4',
      description: 'Modelo estable',
      provider: 'openai'
    }
  }
};

class AIService {
  constructor() {
    this.gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
    this.claude = process.env.CLAUDE_API_KEY ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY }) : null;
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  }

  // Analizar documento con IA
  async analyzeDocument(content, modelKey = 'gemini-3-flash-preview') {
    const model = this.getModelInfo(modelKey);
    
    const prompt = `Analiza este documento y extrae TODAS las APIs, endpoints y credenciales mencionadas.

DOCUMENTO:
${content}

Responde en formato JSON con esta estructura EXACTA:
{
  "apis": [
    {
      "name": "Nombre de la API",
      "baseUrl": "URL base de la API",
      "description": "Descripción de qué hace",
      "authType": "apikey|oauth|bearer|basic|custom",
      "endpoints": [
        {
          "path": "/ruta/endpoint",
          "method": "GET|POST|PUT|DELETE",
          "description": "Qué hace este endpoint",
          "parameters": {
            "required": ["param1", "param2"],
            "optional": ["param3"]
          },
          "requiresAuth": true
        }
      ]
    }
  ]
}

IMPORTANTE: Devuelve SOLO el JSON, sin explicaciones adicionales.`;

    try {
      const response = await this.callAI(modelKey, prompt);
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error analizando documento:', error);
      throw error;
    }
  }

  // Generar parámetros inteligentes para endpoint
  async generateEndpointParameters(endpoint, apiContext, modelKey = 'gemini-3-flash-preview') {
    const prompt = `Necesito ejecutar este endpoint de API:

ENDPOINT: ${endpoint.method} ${endpoint.path}
DESCRIPCIÓN: ${endpoint.description || 'No especificada'}
PARÁMETROS REQUERIDOS: ${JSON.stringify(endpoint.parameters?.required || [])}
PARÁMETROS OPCIONALES: ${JSON.stringify(endpoint.parameters?.optional || [])}

CONTEXTO DE LA API:
${apiContext}

Genera valores de ejemplo REALISTAS Y FUNCIONALES para cada parámetro.
Responde en formato JSON:
{
  "parameters": {
    "nombre_parametro": "valor_ejemplo"
  },
  "explanation": "Breve explicación de qué hacen estos parámetros"
}

IMPORTANTE: Devuelve SOLO el JSON, sin explicaciones adicionales.`;

    try {
      const response = await this.callAI(modelKey, prompt);
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generando parámetros:', error);
      throw error;
    }
  }

  // Generar insights de respuesta de API
  async generateInsights(apiResponse, endpoint, modelKey = 'gemini-3-flash-preview') {
    const prompt = `Analiza esta respuesta de API y genera insights valiosos:

ENDPOINT: ${endpoint.method} ${endpoint.path}
RESPUESTA:
${JSON.stringify(apiResponse, null, 2)}

Genera insights en estas categorías:
- Tendencias: Patrones o tendencias detectadas
- Anomalías: Datos inusuales o fuera de lo normal
- Oportunidades: Acciones recomendadas
- Riesgos: Problemas potenciales

Responde en formato JSON:
{
  "insights": [
    {
      "title": "Título del insight",
      "description": "Descripción detallada en lenguaje humano simple",
      "category": "trend|anomaly|opportunity|risk",
      "confidence": 85
    }
  ]
}

IMPORTANTE: 
- Usa lenguaje HUMANO, NO técnico
- Los insights deben ser accionables
- Devuelve SOLO el JSON, sin explicaciones adicionales`;

    try {
      const response = await this.callAI(modelKey, prompt);
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generando insights:', error);
      throw error;
    }
  }

  // Generar reporte ejecutivo
  async generateExecutiveReport(executions, insights, modelKey = 'gemini-3-flash-preview') {
    const prompt = `Genera un reporte ejecutivo basado en estas ejecuciones de API:

EJECUCIONES:
${JSON.stringify(executions, null, 2)}

INSIGHTS:
${JSON.stringify(insights, null, 2)}

Crea un reporte para nivel ejecutivo que incluya:
1. Resumen ejecutivo (3-5 líneas)
2. Hallazgos clave (máximo 5)
3. Recomendaciones (máximo 3)
4. Datos destacados para dashboard

Responde en formato JSON:
{
  "title": "Título del reporte",
  "summary": "Resumen ejecutivo",
  "keyFindings": ["Finding 1", "Finding 2"],
  "recommendations": ["Recomendación 1"],
  "dashboardData": {
    "metrics": [
      { "label": "Métrica 1", "value": 100, "trend": "up|down|stable" }
    ]
  }
}

IMPORTANTE: Lenguaje SIMPLE y ACCIONABLE para ejecutivos.`;

    try {
      const response = await this.callAI(modelKey, prompt);
      return this.parseJSONResponse(response);
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  // Llamada genérica a IA
  async callAI(modelKey, prompt) {
    const model = this.getModelInfo(modelKey);
    
    switch (model.provider) {
      case 'gemini':
        return await this.callGemini(modelKey, prompt);
      case 'claude':
        return await this.callClaude(modelKey, prompt);
      case 'openai':
        return await this.callOpenAI(modelKey, prompt);
      default:
        throw new Error(`Proveedor no soportado: ${model.provider}`);
    }
  }

  async callGemini(modelKey, prompt) {
    if (!this.gemini) throw new Error('API Key de Gemini no configurada');
    
    const model = this.gemini.getGenerativeModel({ model: modelKey });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async callClaude(modelKey, prompt) {
    if (!this.claude) throw new Error('API Key de Claude no configurada');
    
    const message = await this.claude.messages.create({
      model: modelKey,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    
    return message.content[0].text;
  }

  async callOpenAI(modelKey, prompt) {
    if (!this.openai) throw new Error('API Key de OpenAI no configurada');
    
    const completion = await this.openai.chat.completions.create({
      model: modelKey,
      messages: [{ role: 'user', content: prompt }],
    });
    
    return completion.choices[0].message.content;
  }

  // Obtener información del modelo
  getModelInfo(modelKey) {
    for (const provider in AI_MODELS) {
      if (AI_MODELS[provider][modelKey]) {
        return AI_MODELS[provider][modelKey];
      }
    }
    throw new Error(`Modelo no encontrado: ${modelKey}`);
  }

  // Parsear respuesta JSON de IA
  parseJSONResponse(response) {
    try {
      // Limpiar markdown code blocks si existen
      let cleaned = response.trim();
      cleaned = cleaned.replace(/```json\n?/g, '');
      cleaned = cleaned.replace(/```\n?/g, '');
      cleaned = cleaned.trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Error parseando JSON:', error);
      console.error('Respuesta recibida:', response);
      throw new Error('La IA no devolvió un JSON válido');
    }
  }

  // Obtener todos los modelos disponibles
  getAvailableModels() {
    const models = [];
    
    for (const provider in AI_MODELS) {
      for (const modelKey in AI_MODELS[provider]) {
        models.push({
          key: modelKey,
          ...AI_MODELS[provider][modelKey]
        });
      }
    }
    
    return models;
  }
}

export default new AIService();
