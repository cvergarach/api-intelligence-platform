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

// 3. AGREGAR CREDENCIAL(ES) A API
router.post('/:id/credentials', async (req, res) => {
  console.log(`\n🔑 [CREDENTIALS] ========================================`);
  console.log(`🔑 [CREDENTIALS] API ID: ${req.params.id}`);
  console.log(`🔑 [CREDENTIALS] Body:`, req.body);

  try {
    const { credentials } = req.body;

    // Validar que la API existe
    const api = await prisma.api.findUnique({
      where: { id: req.params.id }
    });

    if (!api) {
      console.error(`❌ [CREDENTIALS] API no encontrada: ${req.params.id}`);
      return res.status(404).json({ error: 'API no encontrada' });
    }

    console.log(`✅ [CREDENTIALS] API encontrada: ${api.name}`);

    // Manejar array de credenciales
    if (Array.isArray(credentials)) {
      console.log(`🔑 [CREDENTIALS] Guardando ${credentials.length} credenciales...`);

      const createdCredentials = [];

      for (const cred of credentials) {
        const { type, key, value, metadata = {} } = cred;

        if (!type || !key || !value) {
          console.error(`❌ [CREDENTIALS] Credencial inválida:`, cred);
          continue;
        }

        console.log(`🔑 [CREDENTIALS] Guardando: ${key}`);

        // Desactivar credenciales anteriores con la misma key
        await prisma.credential.updateMany({
          where: {
            apiId: req.params.id,
            key: key
          },
          data: {
            isActive: false
          }
        });

        // Crear nueva credencial (guardar valor directamente, no hasheado)
        const credential = await prisma.credential.create({
          data: {
            apiId: req.params.id,
            type,
            key,
            value, // Guardar directamente para poder usarlo en requests
            metadata
          }
        });

        // No devolver el valor por seguridad
        const { value: _, ...safeCredential } = credential;
        createdCredentials.push(safeCredential);
      }

      console.log(`✅ [CREDENTIALS] ${createdCredentials.length} credenciales guardadas`);
      console.log(`🔑 [CREDENTIALS] ========================================\n`);

      res.json({
        success: true,
        message: `${createdCredentials.length} credenciales agregadas exitosamente`,
        credentials: createdCredentials
      });
    } else {
      // Manejar credencial única (compatibilidad)
      const { type, key, value, metadata = {} } = req.body;

      if (!type || !key || !value) {
        return res.status(400).json({
          error: 'Se requieren type, key y value'
        });
      }

      console.log(`🔑 [CREDENTIALS] Guardando credencial única: ${key}`);

      // Desactivar credenciales anteriores con la misma key
      await prisma.credential.updateMany({
        where: {
          apiId: req.params.id,
          key: key
        },
        data: {
          isActive: false
        }
      });

      const credential = await prisma.credential.create({
        data: {
          apiId: req.params.id,
          type,
          key,
          value, // Guardar directamente
          metadata
        }
      });

      // No devolver el valor hasheado por seguridad
      const { value: _, ...safeCredential } = credential;

      console.log(`✅ [CREDENTIALS] Credencial guardada`);
      console.log(`🔑 [CREDENTIALS] ========================================\n`);

      res.json({
        success: true,
        message: 'Credencial agregada exitosamente',
        credential: safeCredential
      });
    }
  } catch (error) {
    console.error(`❌ [CREDENTIALS] Error:`, error);
    console.error(`❌ [CREDENTIALS] Stack:`, error.stack);
    console.error(`🔑 [CREDENTIALS] ========================================\n`);
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

// 10. ELIMINAR ENDPOINT
router.delete('/endpoints/:endpointId', async (req, res) => {
  try {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: req.params.endpointId }
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint no encontrado' });
    }

    await prisma.endpoint.delete({
      where: { id: req.params.endpointId }
    });

    res.json({
      success: true,
      message: 'Endpoint eliminado'
    });
  } catch (error) {
    console.error('Error eliminando endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
