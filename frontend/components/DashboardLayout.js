'use client';

import { useState } from 'react';
import { Menu, X, Home, Database, Zap, BarChart3, Settings, FileText, Bell, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Documentos', href: '/documents', icon: FileText },
        { name: 'APIs', href: '/apis', icon: Database },
        { name: 'Ejecuciones', href: '/executions', icon: Zap },
        { name: 'Reportes', href: '/reports', icon: BarChart3 },
        { name: 'Configuración', href: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            DATALIVE
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="px-4 py-6 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom CTA */}
                <div className="absolute bottom-6 left-4 right-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 text-white">
                        <p className="text-sm font-semibold mb-2">¿Necesitas ayuda?</p>
                        <p className="text-xs opacity-90 mb-3">Consulta nuestra documentación</p>
                        <button className="w-full bg-white text-blue-600 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-shadow">
                            Ver Docs
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:ml-64">
                {/* Top navigation */}
                <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-30">
                    <div className="h-full px-4 lg:px-8 flex items-center justify-between">
                        {/* Left side */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-gray-600 hover:text-gray-900"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Search */}
                            <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-xl px-4 py-2 w-80">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar APIs, documentos..."
                                    className="bg-transparent border-none outline-none text-sm w-full"
                                />
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* User menu */}
                            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-semibold text-gray-900">John Carter</p>
                                    <p className="text-xs text-gray-500">Admin</p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    JC
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
