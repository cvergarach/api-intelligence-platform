'use client';

import { Database, Sparkles } from 'lucide-react';

export default function APIsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    APIs
                </h1>
                <p className="text-gray-600">
                    Gestión de APIs descubiertas
                </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-12 text-center text-white shadow-2xl">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Database className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Próximamente</h2>
                <p className="text-lg opacity-90 mb-6">
                    Vista detallada de APIs estará disponible pronto
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm opacity-75">
                    <Sparkles className="w-4 h-4" />
                    <span>Estamos trabajando en nuevas funcionalidades</span>
                </div>
            </div>
        </div>
    );
}
