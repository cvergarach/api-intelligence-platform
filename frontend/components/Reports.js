'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Loader2, Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reports`);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      await axios.post(`${API_URL}/api/reports/generate`, {
        modelKey: 'gemini-3-flash-preview'
      });
      alert('¡Reporte generado exitosamente!');
      fetchReports();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Error generando reporte'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-center py-12">Cargando reportes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reportes Ejecutivos</h2>
        <button
          onClick={generateReport}
          disabled={generating}
          className="btn-primary flex items-center space-x-2"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>Generando...</span></>
          ) : (
            <><Plus className="w-5 h-5" /><span>Nuevo Reporte</span></>
          )}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">No hay reportes generados aún</p>
          <button onClick={generateReport} className="btn-primary">
            Generar Primer Reporte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="card hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  
                  {report.data?.keyFindings && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Hallazgos Clave:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {report.data.keyFindings.map((finding, idx) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.data?.recommendations && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Recomendaciones:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {report.data.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-4">
                    <span>Modelo: {report.createdBy}</span>
                    <span>Ejecuciones: {report.data?.executions || 0}</span>
                    <span>Insights: {report.data?.insights || 0}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                <button className="btn-secondary flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
