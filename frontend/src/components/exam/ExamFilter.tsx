import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cleanSearchParam, normalizeSearchQuery } from '@/lib/utils';

interface ExamFilterProps {
  subjects: Subject[];
  courses: Course[];
  onFilterChange: (filters: any) => void;
  filters: {
    subjectId?: string;
    courseId?: string;
    search?: string;
  };
}

const ExamFilter: React.FC<ExamFilterProps> = ({ subjects, courses, onFilterChange, filters }) => {
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

  const subjectOptions = [
    { value: '', label: 'Tất cả môn học' },
    ...subjects.map(sub => ({
      value: sub.id,
      label: `${sub.subjectName} (${sub.subjectCode})`,
      subLabel: sub.subjectCode
    }))
  ];

  const courseOptions = [
    { value: '', label: 'Tất cả đối tượng thi' },
    ...courses.map(c => ({
      value: c.id,
      label: `${c.name} (${c.courseCode})`,
      subLabel: c.courseCode
    }))
  ];

  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-3 mb-6 bg-white p-4 rounded-md border shadow-xs items-center">
      {/* Search Input */}
      <div className="flex-1 min-w-[240px] w-full md:w-auto">
        <Input 
          placeholder="Tìm kiếm mã hoặc tên đợt sinh đề..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-10"
        />
      </div>

      {/* Searchable Subject Select */}
      <div className="w-full md:w-64 min-w-[200px]">
        <SearchableSelect
          options={subjectOptions}
          value={filters.subjectId || ''}
          onChange={(val) => onFilterChange({ ...filters, subjectId: val || undefined })}
          placeholder="Tất cả môn học"
          searchPlaceholder="Tìm kiếm môn học..."
          className="h-10"
        />
      </div>

      {/* Searchable Course Select */}
      <div className="w-full md:w-64 min-w-[200px]">
        <SearchableSelect
          options={courseOptions}
          value={filters.courseId || ''}
          onChange={(val) => onFilterChange({ ...filters, courseId: val || undefined })}
          placeholder="Tất cả đối tượng thi"
          searchPlaceholder="Tìm kiếm đối tượng thi..."
          className="h-10"
        />
      </div>

      {/* Clear Button */}
      <Button variant="outline" onClick={handleClear} className="h-10 shrink-0">
        Xóa lọc
      </Button>
    </div>
  );
};

export default ExamFilter;
