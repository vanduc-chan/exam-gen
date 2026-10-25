import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X } from 'lucide-react';

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
    if (debouncedSearch !== (filters.search || '')) {
      onFilterChange({ ...filters, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

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
