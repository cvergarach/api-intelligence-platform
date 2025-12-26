import express from 'express';
import { prisma } from '../server.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// 1. GENERAR REPORTE EJECUTIVO
router.post('/generate', async (req, res) => {
  try {
    const { 
      documentId, 
      apiId,
      modelKey = 'gemini-3-flash-preview',
      title = 'Reporte de Análisis de API'
    } = req.body;

    // Obtener ejecuciones e insights
    const where = {};
    if (documentId) where.documentId = documentId;
    if (apiId) {
      where.endpoint = {
        apiId: apiId
      };
    }

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
      take: 100
    });

    if (executions.length === 0) {
      return res.status(400).json({ 
        error: 'No hay ejecuciones para generar el reporte' 
      });
    }

    // Recopilar todos los insights
    const allInsights = executions.flatMap(e => e.insights);

    // Generar reporte con IA
    const reportData = await aiService.generateExecutiveReport(
      executions,
      allInsights,
      modelKey
    );

    // Guardar reporte
    const report = await prisma.report.create({
      data: {
        title: reportData.title || title,
        description: reportData.summary,
        data: {
          executions: executions.length,
          insights: allInsights.length,
          keyFindings: reportData.keyFindings,
          recommendations: reportData.recommendations
        },
        charts: reportData.dashboardData,
        insights: allInsights.map(i => ({
          title: i.title,
          category: i.category,
          confidence: i.confidence
        })),
        createdBy: modelKey
      }
    });

    res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      report
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. LISTAR REPORTES
router.get('/', async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error listando reportes:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. OBTENER REPORTE POR ID
router.get('/:id', async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id }
    });

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. ELIMINAR REPORTE
router.delete('/:id', async (req, res) => {
  try {
    await prisma.report.delete({
      where: { id: req.params.id }
    });

    res.json({ 
      success: true, 
      message: 'Reporte eliminado' 
    });
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. OBTENER DATOS PARA DASHBOARD
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Estadísticas generales
    const totalDocuments = await prisma.document.count();
    const totalApis = await prisma.api.count();
    const totalEndpoints = await prisma.endpoint.count();
    const totalExecutions = await prisma.apiExecution.count();
    const successfulExecutions = await prisma.apiExecution.count({
      where: { success: true }
    });
    const totalInsights = await prisma.insight.count();

    // Insights por categoría
    const insightsByCategory = await prisma.insight.groupBy({
      by: ['category'],
      _count: true
    });

    // Ejecuciones recientes
    const recentExecutions = await prisma.apiExecution.findMany({
      include: {
        endpoint: {
          include: {
            api: true
          }
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 10
    });

    // APIs más ejecutadas
    const topApis = await prisma.apiExecution.groupBy({
      by: ['endpointId'],
      _count: true,
      orderBy: {
        _count: {
          endpointId: 'desc'
        }
      },
      take: 5
    });

    res.json({
      overview: {
        totalDocuments,
        totalApis,
        totalEndpoints,
        totalExecutions,
        successfulExecutions,
        totalInsights,
        successRate: totalExecutions > 0 
          ? ((successfulExecutions / totalExecutions) * 100).toFixed(2)
          : 0
      },
      insightsByCategory: insightsByCategory.map(c => ({
        category: c.category,
        count: c._count
      })),
      recentExecutions,
      topApis: await Promise.all(topApis.map(async (item) => {
        const endpoint = await prisma.endpoint.findUnique({
          where: { id: item.endpointId },
          include: { api: true }
        });
        return {
          api: endpoint?.api.name,
          endpoint: endpoint?.path,
          count: item._count
        };
      }))
    });
  } catch (error) {
    console.error('Error obteniendo stats del dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
