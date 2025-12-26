'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, TrendingUp, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const categoryIcons = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  opportunity: Lightbulb,
  risk: ShieldAlert
};

const categoryColors = {
  trend: 'bg-blue-50 border-blue-200 text-blue-900',
  anomaly: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  opportunity: 'bg-green-50 border-green-200 text-green-900',
  risk: 'bg-red-50 border-red-200 text-red-900'
};

export default function InsightsList({ refreshTrigger }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInsights();
  }, [refreshTrigger]);

  const fetchInsights = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/insights`);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(i => i.category === filter);

  if (loading) return <div className="text-center py-12">Cargando insights...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Insights Generados ({insights.length})</h2>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="all">Todos</option>
          <option value="trend">Tendencias</option>
          <option value="anomaly">Anomalías</option>
          <option value="opportunity">Oportunidades</option>
          <option value="risk">Riesgos</option>
        </select>
      </div>

      {filteredInsights.length === 0 ? (
        <div className="card text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No hay insights generados aún. Ejecuta algunos endpoints primero.' 
              : 'No hay insights de esta categoría'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInsights.map((insight) => {
            const Icon = categoryIcons[insight.category] || AlertCircle;
            const colorClass = categoryColors[insight.category] || 'bg-gray-50 border-gray-200';
            
            return (
              <div key={insight.id} className={`card border-l-4 ${colorClass}`}>
                <div className="flex items-start space-x-3">
                  <Icon className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{insight.title}</h3>
                      <span className="text-sm font-medium px-3 py-1 rounded-full bg-white/50">
                        {Math.round(insight.confidence)}% confianza
                      </span>
                    </div>
                    <p className="text-sm mb-2">{insight.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Modelo: {insight.aiModel}</span>
                      <span>{new Date(insight.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
