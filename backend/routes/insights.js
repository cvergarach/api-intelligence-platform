import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// 1. LISTAR TODOS LOS INSIGHTS
router.get('/', async (req, res) => {
  try {
    const { category, limit = 100 } = req.query;
    
    const where = {};
    if (category) where.category = category;

    const insights = await prisma.insight.findMany({
      where,
      include: {
        execution: {
          include: {
            endpoint: {
              include: {
                api: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(insights);
  } catch (error) {
    console.error('Error listando insights:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. OBTENER INSIGHTS POR EJECUCIÓN
router.get('/by-execution/:executionId', async (req, res) => {
  try {
    const insights = await prisma.insight.findMany({
      where: { executionId: req.params.executionId },
      orderBy: { confidence: 'desc' }
    });

    res.json(insights);
  } catch (error) {
    console.error('Error obteniendo insights:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. OBTENER INSIGHTS POR CATEGORÍA
router.get('/by-category/:category', async (req, res) => {
  try {
    const insights = await prisma.insight.findMany({
      where: { category: req.params.category },
      include: {
        execution: {
          include: {
            endpoint: {
              include: {
                api: true
              }
            }
          }
        }
      },
      orderBy: { confidence: 'desc' },
      take: 50
    });

    res.json(insights);
  } catch (error) {
    console.error('Error obteniendo insights por categoría:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. OBTENER ESTADÍSTICAS DE INSIGHTS
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.insight.count();
    
    const byCategory = await prisma.insight.groupBy({
      by: ['category'],
      _count: true
    });

    const byModel = await prisma.insight.groupBy({
      by: ['aiModel'],
      _count: true
    });

    const avgConfidence = await prisma.insight.aggregate({
      _avg: { confidence: true }
    });

    res.json({
      total,
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: c._count
      })),
      byModel: byModel.map(m => ({
        model: m.aiModel,
        count: m._count
      })),
      averageConfidence: avgConfidence._avg.confidence
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. ELIMINAR INSIGHT
router.delete('/:id', async (req, res) => {
  try {
    await prisma.insight.delete({
      where: { id: req.params.id }
    });

    res.json({ 
      success: true, 
      message: 'Insight eliminado' 
    });
  } catch (error) {
    console.error('Error eliminando insight:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
