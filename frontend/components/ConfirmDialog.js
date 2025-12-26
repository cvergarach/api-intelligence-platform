'use client';

import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Eliminar',
    cancelText = 'Cancelar',
    type = 'danger' // 'danger' | 'warning' | 'info'
}) {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700 text-white'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: 'text-yellow-600',
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    };

    const styles = typeStyles[type];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className={`px-6 py-4 ${styles.bg} border-l-4 ${styles.border}`}>
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className={`w-6 h-6 ${styles.icon} flex-shrink-0 mt-0.5`} />
                        <p className="text-sm text-gray-700">{message}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
