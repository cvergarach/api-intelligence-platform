'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, CheckCircle, XCircle, Zap, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard({ refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reports/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Cargando dashboard...</div>;
  if (!stats) return <div className="card">No hay datos disponibles</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard de Análisis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documentos</p>
              <p className="text-3xl font-bold">{stats.overview.totalDocuments}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">APIs Descubiertas</p>
              <p className="text-3xl font-bold">{stats.overview.totalApis}</p>
            </div>
            <Zap className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="card bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ejecuciones</p>
              <p className="text-3xl font-bold">{stats.overview.totalExecutions}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-purple-600" />
          </div>
        </div>

        <div className="card bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Éxito</p>
              <p className="text-3xl font-bold">{stats.overview.successRate}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Insights por Categoría</h3>
          <div className="space-y-2">
            {stats.insightsByCategory?.map((cat) => (
              <div key={cat.category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="capitalize">{cat.category}</span>
                <span className="font-bold">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Ejecuciones Recientes</h3>
          <div className="space-y-2">
            {stats.recentExecutions?.slice(0, 5).map((exec) => (
              <div key={exec.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="truncate">{exec.endpoint.api.name}</span>
                {exec.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
