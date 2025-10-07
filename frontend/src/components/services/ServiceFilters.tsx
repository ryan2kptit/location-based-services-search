import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useServiceTypes } from '@/hooks/useServices';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';

interface ServiceFiltersProps {
  onFilter: (filters: FilterValues) => void;
}

export interface FilterValues {
  keyword?: string;
  serviceTypeId?: string;
  radius?: number;
  minRating?: number;
  tags?: string[];
}

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({ onFilter }) => {
  const { data: serviceTypes } = useServiceTypes();
  const [filters, setFilters] = useState<FilterValues>({
    radius: 5000,
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    const defaultFilters: FilterValues = { radius: 5000 };
    setFilters(defaultFilters);
    setTagInput('');
    onFilter(defaultFilters);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...(filters.tags || []), tagInput.trim()];
      setFilters({ ...filters, tags: newTags });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = filters.tags?.filter((_, i) => i !== index) || [];
    setFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const ratingOptions = [
    { value: '', label: 'Any Rating' },
    { value: '3', label: '3+ Stars' },
    { value: '4', label: '4+ Stars' },
    { value: '4.5', label: '4.5+ Stars' },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="space-y-4">
        {/* Keyword Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={filters.keyword || ''}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value || undefined })
            }
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Type
          </label>
          <select
            value={filters.serviceTypeId || ''}
            onChange={(e) =>
              setFilters({ ...filters, serviceTypeId: e.target.value || undefined })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {serviceTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Radius Slider */}
        <Slider
          label="Search Radius"
          min={500}
          max={50000}
          step={500}
          value={filters.radius || 5000}
          onChange={(value) => setFilters({ ...filters, radius: value })}
          formatValue={(value) => `${(value / 1000).toFixed(1)} km`}
        />

        {/* Minimum Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Rating
          </label>
          <select
            value={filters.minRating || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                minRating: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
            >
              Add
            </Button>
          </div>
          {filters.tags && filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button type="submit" variant="primary" className="flex-1">
            Apply Filters
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
};
