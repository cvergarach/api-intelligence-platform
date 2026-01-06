'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Database, Zap, Lightbulb, Key, ArrowLeft, Loader2, Settings } from 'lucide-react';
import axios from 'axios';
import DocumentUploader from '../../../components/DocumentUploader';
import APIList from '../../../components/APIList';
import ProjectCredentials from '../../../components/ProjectCredentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProjectView() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('documents');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const tabs = [
        { id: 'documents', label: 'Documentos', icon: FileText },
        { id: 'apis', label: 'APIs', icon: Database },
        { id: 'executions', label: 'Ejecuciones', icon: Zap },
        { id: 'insights', label: 'Insights', icon: Lightbulb },
        { id: 'credentials', label: 'Credenciales', icon: Key },
    ];

    useEffect(() => {
        fetchProject();
    }, [projectId, refreshTrigger]);

    const fetchProject = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/projects/${projectId}`);
            setProject(response.data);
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentProcessed = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('apis');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Proyecto no encontrado</p>
            </div>
        );
    }

    return (
        <div>
            {/* Breadcrumb */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Volver a Proyectos</span>
                </button>
            </div>

            {/* Project Header */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                        {project.description && (
                            <p className="text-gray-600 mb-4">{project.description}</p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                    <strong className="text-gray-900">{project.stats?.documents || 0}</strong> Documentos
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                    <strong className="text-gray-900">{project.stats?.apis || 0}</strong> APIs
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                    <strong className="text-gray-900">{project.stats?.executions || 0}</strong> Ejecuciones
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Lightbulb className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                    <strong className="text-gray-900">{project.stats?.insights || 0}</strong> Insights
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'border-slate-800 text-slate-800'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'documents' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Documentos del Proyecto</h2>
                            <p className="text-gray-600 mb-6">
                                Sube documentación técnica (PDFs o URLs) para descubrir APIs automáticamente
                            </p>
                            <DocumentUploader
                                projectId={projectId}
                                onDocumentProcessed={handleDocumentProcessed}
                            />
                        </div>
                    )}

                    {activeTab === 'apis' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">APIs Descubiertas</h2>
                            <p className="text-gray-600 mb-6">
                                APIs encontradas en los documentos de este proyecto
                            </p>
                            <APIList projectId={projectId} refreshTrigger={refreshTrigger} />
                        </div>
                    )}

                    {activeTab === 'executions' && (
                        <div className="text-center py-12">
                            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Historial de Ejecuciones</h3>
                            <p className="text-gray-600">
                                Aquí verás todas las ejecuciones de APIs de este proyecto
                            </p>
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="text-center py-12">
                            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Insights Generados</h3>
                            <p className="text-gray-600">
                                Los insights de IA aparecerán aquí después de ejecutar APIs
                            </p>
                        </div>
                    )}

                    {activeTab === 'credentials' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Credenciales del Proyecto</h2>
                            <p className="text-gray-600 mb-6">
                                Gestiona las credenciales que se usarán en todas las APIs de este proyecto
                            </p>
                            <ProjectCredentials projectId={projectId} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
