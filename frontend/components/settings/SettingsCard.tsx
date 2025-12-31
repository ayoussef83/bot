'use client';

interface SettingsCardProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function SettingsCard({
  title,
  description,
  children,
  footer,
  className = '',
}: SettingsCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
        <div>{children}</div>
      </div>
      {footer && <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">{footer}</div>}
    </div>
  );
}

