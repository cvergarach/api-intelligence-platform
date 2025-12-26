'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Play, Key, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function APIList({ refreshTrigger }) {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedApi, setExpandedApi] = useState(null);
  const [executing, setExecuting] = useState(null);

  useEffect(() => {
    fetchAPIs();
  }, [refreshTrigger]);

  const fetchAPIs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/apis`);
      setApis(response.data);
    } catch (error) {
      console.error('Error fetching APIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeEndpoint = async (endpointId) => {
    setExecuting(endpointId);
    try {
      await axios.post(`${API_URL}/api/executions/execute/${endpointId}`, {
        parameters: {},
        modelKey: 'gemini-3-flash-preview'
      });
      alert('Endpoint ejecutado! Ve a Dashboard para ver resultados');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Error ejecutando'));
    } finally {
      setExecuting(null);
    }
  };

  if (loading) return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  if (apis.length === 0) return <div className="card text-center">No hay APIs descubiertas aún. Sube un documento primero.</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Paso 2: APIs Descubiertas ({apis.length})</h2>
      
      {apis.map((api) => (
        <div key={api.id} className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary-600" />
                <span>{api.name}</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">{api.baseUrl}</p>
              <p className="text-sm text-gray-500 mt-1">{api.description || 'Sin descripción'}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-gray-600">Autenticación: <strong>{api.authType}</strong></span>
                <span className="text-gray-600">Endpoints: <strong>{api.endpoints?.length || 0}</strong></span>
              </div>
            </div>
            <button
              onClick={() => setExpandedApi(expandedApi === api.id ? null : api.id)}
              className="btn-secondary"
            >
              {expandedApi === api.id ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>

          {expandedApi === api.id && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <h4 className="font-semibold">Endpoints disponibles:</h4>
              {api.endpoints?.map((endpoint) => (
                <div key={endpoint.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      endpoint.method === 'GET' ? 'bg-green-200' :
                      endpoint.method === 'POST' ? 'bg-blue-200' :
                      endpoint.method === 'PUT' ? 'bg-yellow-200' : 'bg-red-200'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="ml-2 font-mono text-sm">{endpoint.path}</span>
                    {endpoint.description && (
                      <p className="text-xs text-gray-600 mt-1">{endpoint.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => executeEndpoint(endpoint.id)}
                    disabled={executing === endpoint.id}
                    className="btn-primary flex items-center space-x-1"
                  >
                    {executing === endpoint.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Ejecutar</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
