'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({
    title,
    value,
    change,
    changeType = 'increase',
    icon: Icon,
    color = 'blue',
    subtitle
}) {
    const colorClasses = {
        blue: {
            bg: 'from-slate-700 to-slate-900',
            light: 'bg-slate-50',
            text: 'text-slate-700',
            ring: 'ring-slate-500/10'
        },
        purple: {
            bg: 'from-indigo-700 to-indigo-900',
            light: 'bg-indigo-50',
            text: 'text-indigo-700',
            ring: 'ring-indigo-500/10'
        },
        green: {
            bg: 'from-emerald-700 to-emerald-900',
            light: 'bg-emerald-50',
            text: 'text-emerald-700',
            ring: 'ring-emerald-500/10'
        },
        orange: {
            bg: 'from-amber-700 to-amber-900',
            light: 'bg-amber-50',
            text: 'text-amber-700',
            ring: 'ring-amber-500/10'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>

                    {change !== undefined && (
                        <div className="flex items-center space-x-1">
                            {changeType === 'increase' ? (
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-semibold ${changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                {change}%
                            </span>
                            <span className="text-sm text-gray-500">vs last month</span>
                        </div>
                    )}

                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
                    )}
                </div>

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-sm ${colors.ring} ring-4 group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
        </div>
    );
}
