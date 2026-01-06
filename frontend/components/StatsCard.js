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
            bg: 'from-blue-500 to-blue-600',
            light: 'bg-blue-50',
            text: 'text-blue-600',
            ring: 'ring-blue-500/20'
        },
        purple: {
            bg: 'from-purple-500 to-purple-600',
            light: 'bg-purple-50',
            text: 'text-purple-600',
            ring: 'ring-purple-500/20'
        },
        green: {
            bg: 'from-green-500 to-green-600',
            light: 'bg-green-50',
            text: 'text-green-600',
            ring: 'ring-green-500/20'
        },
        orange: {
            bg: 'from-orange-500 to-orange-600',
            light: 'bg-orange-50',
            text: 'text-orange-600',
            ring: 'ring-orange-500/20'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>

                    {change !== undefined && (
                        <div className="flex items-center space-x-1">
                            {changeType === 'increase' ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm font-semibold ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'
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

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg ${colors.ring} ring-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
        </div>
    );
}
