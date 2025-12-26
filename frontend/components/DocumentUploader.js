'use client';

import { useState } from 'react';
import axios from 'axios';
import { Upload, Globe, Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DocumentUploader({ onDocumentProcessed }) {
  const [mode, setMode] = useState('pdf');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  const models = [
    { key: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Recomendado)', provider: 'Gemini' },
    { key: 'gemini-3-pro', label: 'Gemini 3 Pro', provider: 'Gemini' },
    { key: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'Claude' },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleUploadPDF = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo PDF' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelKey', selectedModel);

      await axios.post(`${API_URL}/api/documents/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: '¡PDF procesado! Analizando APIs con IA...' });
      setFile(null);
      if (onDocumentProcessed) onDocumentProcessed();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al subir el PDF' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWeb = async () => {
    if (!url.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa una URL válida' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await axios.post(`${API_URL}/api/documents/analyze-web`, {
        url: url.trim(),
        modelKey: selectedModel
      });

      setMessage({ type: 'success', text: '¡Sitio web analizado! Buscando APIs...' });
      setUrl('');
      if (onDocumentProcessed) onDocumentProcessed();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al analizar la web' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Paso 1: Cargar Documentación</h2>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('pdf')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              mode === 'pdf' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Subir PDF</span>
          </button>
          <button
            onClick={() => setMode('web')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              mode === 'web' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span>Analizar Web</span>
          </button>
        </div>

        <div className="mb-6">
          <label className="label-text">Selecciona el modelo de IA:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="input-field"
          >
            {models.map((model) => (
              <option key={model.key} value={model.key}>
                {model.label} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        {mode === 'pdf' ? (
          <div className="space-y-4">
            <div>
              <label className="label-text">Archivo PDF:</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="input-field"
                disabled={loading}
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Archivo seleccionado: {file.name}
                </p>
              )}
            </div>
            <button
              onClick={handleUploadPDF}
              disabled={loading || !file}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Procesando...</span></>
              ) : (
                <><Upload className="w-5 h-5" /><span>Subir y Analizar PDF</span></>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label-text">URL del sitio web:</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.ejemplo.com/docs"
                className="input-field"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleAnalyzeWeb}
              disabled={loading || !url}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Analizando...</span></>
              ) : (
                <><Globe className="w-5 h-5" /><span>Analizar Sitio Web</span></>
              )}
            </button>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <div className="card bg-blue-50">
        <h3 className="font-semibold mb-2">💡 Cómo funciona:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Sube un PDF de documentación de API o ingresa una URL</li>
          <li>La IA analiza el documento y extrae automáticamente las APIs y endpoints</li>
          <li>Encuentra las credenciales necesarias</li>
          <li>Ve a la pestaña "APIs Descubiertas" para ejecutarlas</li>
        </ol>
      </div>
    </div>
  );
}
