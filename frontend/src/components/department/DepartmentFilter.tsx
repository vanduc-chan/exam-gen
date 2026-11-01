import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X } from 'lucide-react';
import { cleanSearchParam, normalizeSearchQuery } from '@/lib/utils';

interface DepartmentFilterProps {
  filters: {
    search?: string;
  };
  onFilterChange: (filters: { search?: string }) => void;
}

const DepartmentFilter: React.FC<DepartmentFilterProps> = ({ filters, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 350);

  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const cleanCurrent = cleanSearchParam(filters.search);
    const cleanDebounced = cleanSearchParam(debouncedSearch);
    if (cleanDebounced !== cleanCurrent) {
      onFilterChange({ ...filters, search: cleanDebounced });
    }
  }, [debouncedSearch]);

  const handleBlur = () => {
    const normalized = normalizeSearchQuery(searchTerm);
    if (normalized !== searchTerm) {
      setSearchTerm(normalized);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const normalized = normalizeSearchQuery(searchTerm);
      if (normalized !== searchTerm) {
        setSearchTerm(normalized);
      }
      const clean = cleanSearchParam(searchTerm);
      if (clean !== cleanSearchParam(filters.search)) {
        onFilterChange({ ...filters, search: clean });
      }
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onFilterChange({});
  };

  const hasFilter = Boolean(filters.search);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-md border shadow-xs items-center">
      <div className="relative flex-1 w-full sm:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm mã hoặc tên khoa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="pl-9 w-full"
        />
      </div>

      {hasFilter && (
        <Button variant="ghost" onClick={handleClear} className="w-full sm:w-auto shrink-0 text-muted-foreground hover:text-foreground">
          <X className="mr-2 h-4 w-4" /> Xóa lọc
        </Button>
      )}
    </div>
  );
};

export default DepartmentFilter;
