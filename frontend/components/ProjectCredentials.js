'use client';

import { useState, useEffect } from 'react';
import { Plus, Key, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProjectCredentials({ projectId }) {
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showValues, setShowValues] = useState({});
    const [newCredential, setNewCredential] = useState({
        name: '',
        type: 'apikey',
        key: '',
        value: ''
    });

    useEffect(() => {
        fetchCredentials();
    }, [projectId]);

    const fetchCredentials = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/projects/${projectId}/credentials`);
            setCredentials(response.data);
        } catch (error) {
            console.error('Error fetching credentials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCredential = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/projects/${projectId}/credentials`, newCredential);
            setNewCredential({ name: '', type: 'apikey', key: '', value: '' });
            setShowAddModal(false);
            fetchCredentials();
        } catch (error) {
            console.error('Error adding credential:', error);
            alert('Error al agregar credencial');
        }
    };

    const handleDeleteCredential = async (credentialId) => {
        if (!confirm('¿Estás seguro de eliminar esta credencial?')) return;

        try {
            await axios.delete(`${API_URL}/api/projects/${projectId}/credentials/${credentialId}`);
            fetchCredentials();
        } catch (error) {
            console.error('Error deleting credential:', error);
            alert('Error al eliminar credencial');
        }
    };

    const toggleShowValue = (credentialId) => {
        setShowValues(prev => ({
            ...prev,
            [credentialId]: !prev[credentialId]
        }));
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
            {/* Add Button */}
            <div className="mb-6">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Agregar Credencial</span>
                </button>
            </div>

            {/* Credentials List */}
            {credentials.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay credenciales configuradas</h3>
                    <p className="text-gray-600 mb-6">
                        Agrega credenciales que se usarán en todas las APIs de este proyecto
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary inline-flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Agregar Primera Credencial</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {credentials.map((credential) => (
                        <div
                            key={credential.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-slate-800 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                            <Key className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{credential.name}</h3>
                                            <p className="text-sm text-gray-500">Tipo: {credential.type}</p>
                                        </div>
                                    </div>

                                    <div className="ml-13 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600 font-medium">Key:</span>
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{credential.key}</code>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600 font-medium">Value:</span>
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                {showValues[credential.id] ? credential.value : '••••••••••••'}
                                            </code>
                                            <button
                                                onClick={() => toggleShowValue(credential.id)}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                                {showValues[credential.id] ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteCredential(credential.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Credential Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nueva Credencial</h2>
                        <form onSubmit={handleAddCredential}>
                            <div className="space-y-4">
                                <div>
                                    <label className="label-text">Nombre Descriptivo *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCredential.name}
                                        onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                                        className="input-field"
                                        placeholder="Ej: API Key Producción"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Un nombre que te ayude a identificar esta credencial
                                    </p>
                                </div>

                                <div>
                                    <label className="label-text">Tipo *</label>
                                    <select
                                        value={newCredential.type}
                                        onChange={(e) => setNewCredential({ ...newCredential, type: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="apikey">API Key</option>
                                        <option value="bearer">Bearer Token</option>
                                        <option value="basic">Basic Auth</option>
                                        <option value="session">Session</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label-text">Key (Nombre del Header/Param) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCredential.key}
                                        onChange={(e) => setNewCredential({ ...newCredential, key: e.target.value })}
                                        className="input-field"
                                        placeholder="Ej: X-API-Key, Authorization"
                                    />
                                </div>

                                <div>
                                    <label className="label-text">Value (Valor de la Credencial) *</label>
                                    <input
                                        type="password"
                                        required
                                        value={newCredential.value}
                                        onChange={(e) => setNewCredential({ ...newCredential, value: e.target.value })}
                                        className="input-field"
                                        placeholder="Ingresa el valor secreto"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Agregar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
