'use client';

import { useState, useEffect } from 'react';
import { X, Key, Zap, AlertCircle, Save, Play, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ExecutionModal({ endpoint, api, onClose, onExecute }) {
    const [step, setStep] = useState('detect'); // detect, credentials, variables, executing
    const [credentials, setCredentials] = useState({});
    const [variables, setVariables] = useState({});
    const [detectedParams, setDetectedParams] = useState({ credentials: [], variables: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatingParams, setGeneratingParams] = useState(false);

    useEffect(() => {
        detectParameters();
    }, []);

    // Detectar automáticamente qué parámetros son credenciales vs variables
    const detectParameters = () => {
        const params = endpoint.parameters || {};
        const required = params.required || [];
        const optional = params.optional || [];

        const credentialKeywords = ['token', 'key', 'secret', 'apikey', 'api_key', 'ticket', 'auth', 'password', 'pwd'];
        const variableKeywords = ['id', 'codigo', 'code', 'number', 'fecha', 'date', 'query', 'search', 'filter'];

        const credentialParams = [];
        const variableParams = [];

        [...required, ...optional].forEach(param => {
            const paramLower = param.toLowerCase();
            const isCredential = credentialKeywords.some(keyword => paramLower.includes(keyword));
            const isVariable = variableKeywords.some(keyword => paramLower.includes(keyword));

            if (isCredential) {
                credentialParams.push({
                    name: param,
                    required: required.includes(param),
                    type: 'credential',
                    description: getParamDescription(param)
                });
            } else if (isVariable || required.includes(param)) {
                variableParams.push({
                    name: param,
                    required: required.includes(param),
                    type: 'variable',
                    description: getParamDescription(param)
                });
            } else {
                variableParams.push({
                    name: param,
                    required: false,
                    type: 'variable',
                    description: getParamDescription(param)
                });
            }
        });

        setDetectedParams({ credentials: credentialParams, variables: variableParams });

        // Cargar credenciales guardadas si existen
        loadSavedCredentials();

        // Decidir siguiente paso
        if (credentialParams.length > 0 && !hasStoredCredentials(api.id)) {
            setStep('credentials');
        } else if (variableParams.length > 0) {
            setStep('variables');
        } else {
            // No hay parámetros, ejecutar directamente
            handleExecute({});
        }
    };

    const getParamDescription = (param) => {
        const descriptions = {
            'ticket': 'Ticket de acceso a la API (credencial permanente)',
            'codigo': 'Código identificador (ej: código de licitación)',
            'token': 'Token de autenticación',
            'apikey': 'API Key de autenticación',
            'api_key': 'API Key de autenticación',
            'id': 'Identificador único',
            'fecha': 'Fecha en formato YYYY-MM-DD',
            'date': 'Fecha en formato YYYY-MM-DD'
        };
        return descriptions[param.toLowerCase()] || `Parámetro ${param}`;
    };

    const hasStoredCredentials = (apiId) => {
        try {
            const stored = localStorage.getItem(`credentials_${apiId}`);
            return !!stored;
        } catch {
            return false;
        }
    };

    const loadSavedCredentials = () => {
        try {
            const stored = localStorage.getItem(`credentials_${api.id}`);
            if (stored) {
                setCredentials(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    };

    const saveCredentials = async () => {
        try {
            // Guardar en localStorage
            localStorage.setItem(`credentials_${api.id}`, JSON.stringify(credentials));

            // Guardar en backend
            await axios.post(`${API_URL}/api/apis/${api.id}/credentials`, {
                credentials: Object.entries(credentials).map(([key, value]) => ({
                    type: 'apikey',
                    key: key,
                    value: value
                }))
            });

            // Pasar a variables si hay, sino ejecutar
            if (detectedParams.variables.length > 0) {
                setStep('variables');
            } else {
                handleExecute(credentials);
            }
        } catch (error) {
            setError('Error guardando credenciales: ' + (error.response?.data?.error || error.message));
        }
    };

    const generateParameters = async () => {
        setGeneratingParams(true);
        setError(null);

        try {
            const response = await axios.post(
                `${API_URL}/api/executions/generate-parameters/${endpoint.id}`,
                { modelKey: 'gemini-3-flash-preview' }
            );

            // Aplicar parámetros generados a variables
            const generated = response.data.parameters || {};
            setVariables(prev => ({ ...prev, ...generated }));

        } catch (error) {
            setError('Error generando parámetros: ' + (error.response?.data?.error || error.message));
        } finally {
            setGeneratingParams(false);
        }
    };

    const handleExecute = async (params = null) => {
        setStep('executing');
        setLoading(true);
        setError(null);

        try {
            const allParams = params || { ...credentials, ...variables };

            const response = await axios.post(
                `${API_URL}/api/executions/execute/${endpoint.id}`,
                {
                    parameters: allParams,
                    modelKey: 'gemini-3-flash-preview'
                }
            );

            if (response.data.success) {
                onExecute(response.data.execution);
                onClose();
            } else {
                setError(response.data.execution.errorMessage || 'Error en la ejecución');
                setStep('variables');
            }
        } catch (error) {
            setError('Error: ' + (error.response?.data?.error || error.message));
            setStep('variables');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Ejecutar Endpoint</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {endpoint.method} {endpoint.path}
                            </span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Step: Credentials */}
                    {step === 'credentials' && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-primary-600">
                                <Key className="w-5 h-5" />
                                <h4 className="font-semibold">Paso 1: Configurar Credenciales</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                                Estas credenciales se guardarán de forma segura y se reutilizarán en futuras ejecuciones.
                            </p>

                            {detectedParams.credentials.map((param) => (
                                <div key={param.name}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {param.name} {param.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                                    <input
                                        type="password"
                                        value={credentials[param.name] || ''}
                                        onChange={(e) => setCredentials({ ...credentials, [param.name]: e.target.value })}
                                        className="input w-full"
                                        placeholder={`Ingresa ${param.name}`}
                                        required={param.required}
                                    />
                                </div>
                            ))}

                            <button
                                onClick={saveCredentials}
                                className="btn-primary w-full flex items-center justify-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>Guardar Credenciales y Continuar</span>
                            </button>
                        </div>
                    )}

                    {/* Step: Variables */}
                    {step === 'variables' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-primary-600">
                                    <Zap className="w-5 h-5" />
                                    <h4 className="font-semibold">
                                        {detectedParams.credentials.length > 0 ? 'Paso 2: ' : ''}Parámetros de Ejecución
                                    </h4>
                                </div>
                                <button
                                    onClick={generateParameters}
                                    disabled={generatingParams}
                                    className="btn-secondary flex items-center space-x-1 text-sm"
                                >
                                    {generatingParams ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    <span>{generatingParams ? 'Generando...' : 'Generar con IA'}</span>
                                </button>
                            </div>

                            <p className="text-sm text-gray-600">
                                Estos parámetros son específicos para esta ejecución.
                            </p>

                            {detectedParams.variables.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No se requieren parámetros variables.</p>
                            ) : (
                                detectedParams.variables.map((param) => (
                                    <div key={param.name}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {param.name} {param.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                                        <input
                                            type="text"
                                            value={variables[param.name] || ''}
                                            onChange={(e) => setVariables({ ...variables, [param.name]: e.target.value })}
                                            className="input w-full"
                                            placeholder={`Ingresa ${param.name}`}
                                            required={param.required}
                                        />
                                    </div>
                                ))
                            )}

                            <button
                                onClick={() => handleExecute()}
                                className="btn-primary w-full flex items-center justify-center space-x-2"
                            >
                                <Play className="w-4 h-4" />
                                <span>Ejecutar Endpoint</span>
                            </button>
                        </div>
                    )}

                    {/* Step: Executing */}
                    {step === 'executing' && (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary-600 mb-4" />
                            <p className="text-lg font-semibold">Ejecutando endpoint...</p>
                            <p className="text-sm text-gray-600 mt-2">Esto puede tomar unos segundos</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                {step !== 'executing' && (
                    <div className="border-t px-6 py-4 bg-gray-50">
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><strong>API:</strong> {api.name}</p>
                            <p><strong>Endpoint:</strong> {api.baseUrl}{endpoint.path}</p>
                            {endpoint.description && <p><strong>Descripción:</strong> {endpoint.description}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
