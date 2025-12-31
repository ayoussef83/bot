'use client';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: Array<{
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }>;
}

export default function FilterBar({ filters }: FilterBarProps) {
  return (
    <div className="flex gap-4 mb-4">
      {filters.map((filter) => (
        <div key={filter.key} className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {filter.label}
          </label>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}




