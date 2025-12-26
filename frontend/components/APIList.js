'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Play, Key, Loader2, ChevronDown, ChevronUp, CheckCircle, Trash2 } from 'lucide-react';
import ExecutionModal from './ExecutionModal';
import ConfirmDialog from './ConfirmDialog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function APIList({ refreshTrigger }) {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedApi, setExpandedApi] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [selectedApi, setSelectedApi] = useState(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: null, item: null });

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

  const handleExecuteClick = (endpoint, api) => {
    setSelectedEndpoint(endpoint);
    setSelectedApi(api);
    setShowExecutionModal(true);
  };

  const handleExecutionComplete = (execution) => {
    console.log('Execution completed:', execution);
    // Podrías mostrar una notificación de éxito aquí
  };

  const handleDeleteAPI = async (apiId) => {
    try {
      await axios.delete(`${API_URL}/api/apis/${apiId}`);
      setApis(apis.filter(api => api.id !== apiId));
    } catch (error) {
      console.error('Error deleting API:', error);
      alert('Error al eliminar la API: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteEndpoint = async (apiId, endpointId) => {
    try {
      await axios.delete(`${API_URL}/api/apis/endpoints/${endpointId}`);
      // Update local state
      setApis(apis.map(api => {
        if (api.id === apiId) {
          return {
            ...api,
            endpoints: api.endpoints.filter(ep => ep.id !== endpointId)
          };
        }
        return api;
      }));
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      alert('Error al eliminar el endpoint: ' + (error.response?.data?.error || error.message));
    }
  };

  const openDeleteDialog = (type, item) => {
    setDeleteDialog({ isOpen: true, type, item });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, type: null, item: null });
  };

  const confirmDelete = () => {
    if (deleteDialog.type === 'api') {
      handleDeleteAPI(deleteDialog.item.id);
    } else if (deleteDialog.type === 'endpoint') {
      handleDeleteEndpoint(deleteDialog.item.apiId, deleteDialog.item.id);
    }
  };

  if (loading) return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  if (apis.length === 0) return <div className="card text-center">No hay APIs descubiertas aún. Sube un documento primero.</div>;

  return (
    <>
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
                  {api.credentials?.length > 0 && (
                    <span className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Credenciales configuradas</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog('api', api);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar API"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setExpandedApi(expandedApi === api.id ? null : api.id)}
                  className="btn-secondary"
                >
                  {expandedApi === api.id ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
            </div>

            {expandedApi === api.id && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <h4 className="font-semibold">Endpoints disponibles:</h4>
                {api.endpoints?.map((endpoint) => (
                  <div key={endpoint.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${endpoint.method === 'GET' ? 'bg-green-200 text-green-800' :
                            endpoint.method === 'POST' ? 'bg-blue-200 text-blue-800' :
                              endpoint.method === 'PUT' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-red-200 text-red-800'
                            }`}>
                            {endpoint.method}
                          </span>
                          <span className="font-mono text-sm font-medium">{endpoint.path}</span>
                        </div>
                        {endpoint.description && (
                          <p className="text-sm text-gray-600 mt-2">{endpoint.description}</p>
                        )}
                        {endpoint.parameters && (
                          <div className="mt-2 text-xs text-gray-500">
                            {endpoint.parameters.required?.length > 0 && (
                              <p>
                                <strong>Requeridos:</strong> {endpoint.parameters.required.join(', ')}
                              </p>
                            )}
                            {endpoint.parameters.optional?.length > 0 && (
                              <p>
                                <strong>Opcionales:</strong> {endpoint.parameters.optional.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog('endpoint', { ...endpoint, apiId: api.id });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar endpoint"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExecuteClick(endpoint, api)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Ejecutar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showExecutionModal && selectedEndpoint && selectedApi && (
        <ExecutionModal
          endpoint={selectedEndpoint}
          api={selectedApi}
          onClose={() => {
            setShowExecutionModal(false);
            setSelectedEndpoint(null);
            setSelectedApi(null);
          }}
          onExecute={handleExecutionComplete}
        />
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title={deleteDialog.type === 'api' ? 'Eliminar API' : 'Eliminar Endpoint'}
        message={
          deleteDialog.type === 'api'
            ? `¿Estás seguro de que deseas eliminar la API "${deleteDialog.item?.name}"? Esto también eliminará todos sus endpoints y credenciales asociadas.`
            : `¿Estás seguro de que deseas eliminar el endpoint "${deleteDialog.item?.method} ${deleteDialog.item?.path}"?`
        }
        confirmText="Eliminar"
        type="danger"
      />
    </>
  );
}
