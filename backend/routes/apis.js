import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../server.js';

const router = express.Router();

// 1. LISTAR TODAS LAS APIS
router.get('/', async (req, res) => {
  try {
    const apis = await prisma.api.findMany({
      include: {
        document: true,
        endpoints: true,
        credentials: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(apis);
  } catch (error) {
    console.error('Error listando APIs:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. OBTENER API POR ID
router.get('/:id', async (req, res) => {
  try {
    const api = await prisma.api.findUnique({
      where: { id: req.params.id },
      include: {
        document: true,
        endpoints: true,
        credentials: true
      }
    });

    if (!api) {
      return res.status(404).json({ error: 'API no encontrada' });
    }

    res.json(api);
  } catch (error) {
    console.error('Error obteniendo API:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. AGREGAR CREDENCIAL A API
router.post('/:id/credentials', async (req, res) => {
  try {
    const { type, key, value, metadata = {} } = req.body;

    if (!type || !key || !value) {
      return res.status(400).json({ 
        error: 'Se requieren type, key y value' 
      });
    }

    // Validar que la API existe
    const api = await prisma.api.findUnique({
      where: { id: req.params.id }
    });

    if (!api) {
      return res.status(404).json({ error: 'API no encontrada' });
    }

    // Encriptar el valor de la credencial
    const hashedValue = await bcrypt.hash(value, 10);

    const credential = await prisma.credential.create({
      data: {
        apiId: req.params.id,
        type,
        key,
        value: hashedValue,
        metadata
      }
    });

    // No devolver el valor hasheado por seguridad
    const { value: _, ...safeCredential } = credential;

    res.json({
      success: true,
      message: 'Credencial agregada exitosamente',
      credential: safeCredential
    });
  } catch (error) {
    console.error('Error agregando credencial:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. LISTAR CREDENCIALES DE UNA API
router.get('/:id/credentials', async (req, res) => {
  try {
    const credentials = await prisma.credential.findMany({
      where: { apiId: req.params.id },
      select: {
        id: true,
        type: true,
        key: true,
        metadata: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
        // NO incluir 'value' por seguridad
      }
    });

    res.json(credentials);
  } catch (error) {
    console.error('Error listando credenciales:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. ACTUALIZAR CREDENCIAL
router.put('/credentials/:credentialId', async (req, res) => {
  try {
    const { value, isActive, metadata } = req.body;
    const updateData = {};

    if (value) {
      updateData.value = await bcrypt.hash(value, 10);
    }

    if (typeof isActive !== 'undefined') {
      updateData.isActive = isActive;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const credential = await prisma.credential.update({
      where: { id: req.params.credentialId },
      data: updateData,
      select: {
        id: true,
        type: true,
        key: true,
        metadata: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Credencial actualizada',
      credential
    });
  } catch (error) {
    console.error('Error actualizando credencial:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. ELIMINAR CREDENCIAL
router.delete('/credentials/:credentialId', async (req, res) => {
  try {
    await prisma.credential.delete({
      where: { id: req.params.credentialId }
    });

    res.json({ 
      success: true, 
      message: 'Credencial eliminada' 
    });
  } catch (error) {
    console.error('Error eliminando credencial:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. LISTAR ENDPOINTS DE UNA API
router.get('/:id/endpoints', async (req, res) => {
  try {
    const endpoints = await prisma.endpoint.findMany({
      where: { apiId: req.params.id },
      orderBy: { createdAt: 'asc' }
    });

    res.json(endpoints);
  } catch (error) {
    console.error('Error listando endpoints:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. ACTUALIZAR API
router.put('/:id', async (req, res) => {
  try {
    const { name, baseUrl, description, authType } = req.body;
    
    const api = await prisma.api.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(baseUrl && { baseUrl }),
        ...(description && { description }),
        ...(authType && { authType })
      }
    });

    res.json({
      success: true,
      message: 'API actualizada',
      api
    });
  } catch (error) {
    console.error('Error actualizando API:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. ELIMINAR API
router.delete('/:id', async (req, res) => {
  try {
    await prisma.api.delete({
      where: { id: req.params.id }
    });

    res.json({ 
      success: true, 
      message: 'API eliminada' 
    });
  } catch (error) {
    console.error('Error eliminando API:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
