import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Department } from '@/types/department';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Search, X } from 'lucide-react';

interface DepartmentGroupFilterProps {
  departments: Department[];
  filters: {
    search?: string;
    departmentId?: string;
  };
  onFilterChange: (filters: { search?: string; departmentId?: string }) => void;
}

const DepartmentGroupFilter: React.FC<DepartmentGroupFilterProps> = ({
  departments,
  filters,
  onFilterChange,
}) => {
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

  const departmentOptions = [
    { value: '', label: 'Tất cả các khoa' },
    ...departments.map(d => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
      subLabel: d.code,
    }))
  ];

  const hasFilter = Boolean(filters.search || filters.departmentId);

  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-3 mb-6 bg-white p-4 rounded-md border shadow-xs items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] w-full md:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm mã hoặc tên tổ bộ môn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Department Filter */}
      <div className="w-full md:w-72">
        <SearchableSelect
          options={departmentOptions}
          value={filters.departmentId || ''}
          onChange={(val) => onFilterChange({ ...filters, departmentId: val || undefined })}
          placeholder="Tất cả các khoa"
          searchPlaceholder="Tìm kiếm khoa..."
        />
      </div>

      {/* Clear Button */}
      {hasFilter && (
        <Button variant="ghost" onClick={handleClear} className="w-full md:w-auto shrink-0 text-muted-foreground hover:text-foreground">
          <X className="mr-2 h-4 w-4" /> Xóa lọc
        </Button>
      )}
    </div>
  );
};

export default DepartmentGroupFilter;
