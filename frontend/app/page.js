'use client';

import { useState, useEffect } from 'react';
import { FileText, Database, Zap, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import DocumentUploader from '../components/DocumentUploader';
import APIList from '../components/APIList';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [stats, setStats] = useState({
    documents: 0,
    apis: 0,
    endpoints: 0,
    executions: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const [apisRes] = await Promise.all([
        axios.get(`${API_URL}/api/apis`)
      ]);

      const apis = apisRes.data || [];
      const totalEndpoints = apis.reduce((sum, api) => sum + (api.endpoints?.length || 0), 0);

      setStats({
        documents: apis.length > 0 ? apis.length : 0,
        apis: apis.length,
        endpoints: totalEndpoints,
        executions: 0 // TODO: Get from executions endpoint
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDocumentProcessed = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Bienvenido a tu plataforma de inteligencia de APIs
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Documentos"
          value={stats.documents}
          change={12.5}
          changeType="increase"
          icon={FileText}
          color="blue"
          subtitle="Documentos procesados"
        />
        <StatsCard
          title="APIs Descubiertas"
          value={stats.apis}
          change={8.2}
          changeType="increase"
          icon={Database}
          color="purple"
          subtitle="APIs detectadas"
        />
        <StatsCard
          title="Endpoints"
          value={stats.endpoints}
          change={15.3}
          changeType="increase"
          icon={Zap}
          color="green"
          subtitle="Endpoints disponibles"
        />
        <StatsCard
          title="Ejecuciones"
          value={stats.executions}
          change={-2.4}
          changeType="decrease"
          icon={Activity}
          color="orange"
          subtitle="Llamadas realizadas"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          {/* Document Uploader */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cargar Documentación</h2>
                <p className="text-sm text-gray-500">Sube PDFs o analiza URLs</p>
              </div>
            </div>
            <DocumentUploader onDocumentProcessed={handleDocumentProcessed} />
          </div>

          {/* APIs List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">APIs Descubiertas</h2>
                <p className="text-sm text-gray-500">{stats.apis} APIs disponibles</p>
              </div>
            </div>
            <APIList refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 text-left transition-all duration-200 hover:scale-105">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Subir PDF</span>
                </div>
              </button>
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 text-left transition-all duration-200 hover:scale-105">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Ejecutar API</span>
                </div>
              </button>
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 text-left transition-all duration-200 hover:scale-105">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Ver Reportes</span>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actividad Reciente</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">API ejecutada</p>
                  <p className="text-xs text-gray-500 truncate">Mercado Público - Licitaciones</p>
                  <p className="text-xs text-gray-400 mt-1">Hace 5 minutos</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Documento procesado</p>
                  <p className="text-xs text-gray-500 truncate">Huawei NCE Streams</p>
                  <p className="text-xs text-gray-400 mt-1">Hace 1 hora</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Nueva API detectada</p>
                  <p className="text-xs text-gray-500 truncate">3 endpoints encontrados</p>
                  <p className="text-xs text-gray-400 mt-1">Hace 2 horas</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Estado del Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backend API</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Activo</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de Datos</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Conectado</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Services</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Operativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
