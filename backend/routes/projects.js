import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// 1. LISTAR PROYECTOS
router.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                documents: true,
                credentials: true,
                _count: {
                    select: {
                        documents: true,
                        credentials: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calcular stats adicionales
        const projectsWithStats = await Promise.all(
            projects.map(async (project) => {
                const apis = await prisma.api.findMany({
                    where: {
                        document: {
                            projectId: project.id
                        }
                    }
                });

                const executions = await prisma.apiExecution.findMany({
                    where: {
                        document: {
                            projectId: project.id
                        }
                    }
                });

                return {
                    ...project,
                    stats: {
                        documents: project._count.documents,
                        apis: apis.length,
                        executions: executions.length,
                        credentials: project._count.credentials
                    }
                };
            })
        );

        res.json(projectsWithStats);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. CREAR PROYECTO
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre del proyecto es requerido' });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description
            }
        });

        res.json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. OBTENER PROYECTO POR ID
router.get('/:id', async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                documents: {
                    include: {
                        apis: {
                            include: {
                                endpoints: true
                            }
                        }
                    }
                },
                credentials: true
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        // Calcular stats
        const executions = await prisma.apiExecution.findMany({
            where: {
                document: {
                    projectId: project.id
                }
            }
        });

        const insights = await prisma.insight.findMany({
            where: {
                projectId: project.id
            }
        });

        const totalApis = project.documents.reduce((sum, doc) => sum + doc.apis.length, 0);
        const totalEndpoints = project.documents.reduce((sum, doc) =>
            sum + doc.apis.reduce((apiSum, api) => apiSum + api.endpoints.length, 0), 0
        );

        res.json({
            ...project,
            stats: {
                documents: project.documents.length,
                apis: totalApis,
                endpoints: totalEndpoints,
                executions: executions.length,
                insights: insights.length,
                credentials: project.credentials.length
            }
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. ACTUALIZAR PROYECTO
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: {
                name,
                description
            }
        });

        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. ELIMINAR PROYECTO
router.delete('/:id', async (req, res) => {
    try {
        await prisma.project.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true, message: 'Proyecto eliminado' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. LISTAR CREDENCIALES DEL PROYECTO
router.get('/:id/credentials', async (req, res) => {
    try {
        const credentials = await prisma.projectCredential.findMany({
            where: { projectId: req.params.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json(credentials);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ error: error.message });
    }
});

// 7. AGREGAR CREDENCIAL AL PROYECTO
router.post('/:id/credentials', async (req, res) => {
    try {
        const { name, type, key, value, metadata } = req.body;

        if (!name || !type || !key || !value) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const credential = await prisma.projectCredential.create({
            data: {
                projectId: req.params.id,
                name,
                type,
                key,
                value, // TODO: Encriptar en producción
                metadata
            }
        });

        res.json(credential);
    } catch (error) {
        console.error('Error creating credential:', error);
        res.status(500).json({ error: error.message });
    }
});

// 8. ELIMINAR CREDENCIAL
router.delete('/:id/credentials/:credentialId', async (req, res) => {
    try {
        await prisma.projectCredential.delete({
            where: { id: req.params.credentialId }
        });

        res.json({ success: true, message: 'Credencial eliminada' });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ error: error.message });
    }
});

// 9. LISTAR INSIGHTS DEL PROYECTO
router.get('/:id/insights', async (req, res) => {
    try {
        const insights = await prisma.insight.findMany({
            where: {
                OR: [
                    { projectId: req.params.id },
                    {
                        execution: {
                            document: {
                                projectId: req.params.id
                            }
                        }
                    }
                ]
            },
            include: {
                execution: {
                    include: {
                        endpoint: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(insights);
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
