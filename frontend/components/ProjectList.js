'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen, FileText, Database, Zap, Loader2 } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/projects`);
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/projects`, newProject);
            setNewProject({ name: '', description: '' });
            setShowCreateModal(false);
            fetchProjects();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Error al crear el proyecto');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos</h1>
                    <p className="text-gray-600 mt-1">Organiza tus documentos y APIs por proyecto</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Proyecto</span>
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay proyectos aún</h3>
                    <p className="text-gray-600 mb-6">Crea tu primer proyecto para comenzar</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary inline-flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Crear Proyecto</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block group"
                        >
                            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-slate-800 hover:shadow-lg transition-all duration-200">
                                {/* Project Icon */}
                                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-6 h-6 text-white" />
                                </div>

                                {/* Project Name */}
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-slate-800">
                                    {project.name}
                                </h3>

                                {/* Description */}
                                {project.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {project.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{project.stats?.documents || 0}</p>
                                        <p className="text-xs text-gray-500">Docs</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{project.stats?.apis || 0}</p>
                                        <p className="text-xs text-gray-500">APIs</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{project.stats?.executions || 0}</p>
                                        <p className="text-xs text-gray-500">Ejec.</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuevo Proyecto</h2>
                        <form onSubmit={handleCreateProject}>
                            <div className="space-y-4">
                                <div>
                                    <label className="label-text">Nombre del Proyecto *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        className="input-field"
                                        placeholder="Ej: Mercado Público APIs"
                                    />
                                </div>
                                <div>
                                    <label className="label-text">Descripción (opcional)</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        className="input-field"
                                        rows="3"
                                        placeholder="Describe el propósito de este proyecto..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Crear Proyecto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
