import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DepartmentGroup } from '@/types/departmentGroup';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Search, X } from 'lucide-react';
import { cleanSearchParam, normalizeSearchQuery } from '@/lib/utils';

interface SubjectFilterProps {
  departmentGroups: DepartmentGroup[];
  filters: {
    search?: string;
    departmentGroupId?: string;
  };
  onFilterChange: (filters: { search?: string; departmentGroupId?: string }) => void;
}

const SubjectFilter: React.FC<SubjectFilterProps> = ({
  departmentGroups,
  filters,
  onFilterChange,
}) => {
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

  const groupOptions = [
    { value: '', label: 'Tất cả tổ bộ môn' },
    ...departmentGroups.map(g => ({
      value: g.id,
      label: `${g.name} (${g.code})`,
      subLabel: g.code,
    }))
  ];

  const hasFilter = Boolean(filters.search || filters.departmentGroupId);

  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-3 mb-6 bg-white p-4 rounded-md border shadow-xs items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] w-full md:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm mã hoặc tên môn học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="pl-9 w-full"
        />
      </div>

      {/* Department Group Filter */}
      <div className="w-full md:w-72">
        <SearchableSelect
          options={groupOptions}
          value={filters.departmentGroupId || ''}
          onChange={(val) => onFilterChange({ ...filters, departmentGroupId: val || undefined })}
          placeholder="Tất cả tổ bộ môn"
          searchPlaceholder="Tìm kiếm tổ bộ môn..."
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

export default SubjectFilter;
