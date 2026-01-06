'use client';

import { FileText, Sparkles } from 'lucide-react';

export default function DocumentsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Documentos
                </h1>
                <p className="text-gray-600">
                    Gestión de documentación técnica
                </p>
            </div>

            {/* Coming Soon Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Próximamente</h2>
                <p className="text-lg opacity-90 mb-6">
                    Esta sección estará disponible pronto
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm opacity-75">
                    <Sparkles className="w-4 h-4" />
                    <span>Estamos trabajando en nuevas funcionalidades</span>
                </div>
            </div>

            {/* Features Preview */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Gestión de PDFs</h3>
                    <p className="text-sm text-gray-600">Organiza y administra todos tus documentos técnicos</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Análisis Inteligente</h3>
                    <p className="text-sm text-gray-600">Extracción automática de información clave</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Historial</h3>
                    <p className="text-sm text-gray-600">Accede al historial completo de documentos procesados</p>
                </div>
            </div>
        </div>
    );
}
