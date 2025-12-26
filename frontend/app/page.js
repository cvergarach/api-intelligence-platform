'use client';

import { useState } from 'react';
import { Upload, Globe, FileText, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import DocumentUploader from '../components/DocumentUploader';
import APIList from '../components/APIList';
import Dashboard from '../components/Dashboard';
import InsightsList from '../components/InsightsList';
import Reports from '../components/Reports';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'upload', label: 'Cargar Documentos', icon: Upload },
    { id: 'apis', label: 'APIs Descubiertas', icon: Zap },
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'insights', label: 'Insights', icon: AlertCircle },
    { id: 'reports', label: 'Reportes', icon: FileText }
  ];

  const handleDocumentProcessed = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('apis');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                API Intelligence Platform
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Descubre y ejecuta APIs automáticamente desde documentación
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Sistema activo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <DocumentUploader onDocumentProcessed={handleDocumentProcessed} />
        )}
        
        {activeTab === 'apis' && (
          <APIList refreshTrigger={refreshTrigger} />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard refreshTrigger={refreshTrigger} />
        )}
        
        {activeTab === 'insights' && (
          <InsightsList refreshTrigger={refreshTrigger} />
        )}
        
        {activeTab === 'reports' && (
          <Reports />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2025 Alquimia Datalive - API Intelligence Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
