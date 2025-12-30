'use client';

import { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
  default: {
    bg: 'bg-white',
    border: 'border-gray-200',
    title: 'text-gray-500',
    value: 'text-gray-900',
  },
  success: {
    bg: 'bg-white',
    border: 'border-green-200',
    title: 'text-gray-500',
    value: 'text-green-600',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-yellow-200',
    title: 'text-gray-500',
    value: 'text-yellow-600',
  },
  danger: {
    bg: 'bg-white',
    border: 'border-red-200',
    title: 'text-gray-500',
    value: 'text-red-600',
  },
  info: {
    bg: 'bg-white',
    border: 'border-blue-200',
    title: 'text-gray-500',
    value: 'text-blue-600',
  },
};

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  variant = 'default',
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} border rounded-lg p-6 shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
          <p className={`text-2xl font-bold ${styles.value} mt-2`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.positive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${styles.value} opacity-50`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

