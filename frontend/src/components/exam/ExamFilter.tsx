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
    if (debouncedSearch !== (filters.search || '')) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onFilterChange({});
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-md border">
      <div className="flex-1">
        <Input 
          placeholder="Tìm kiếm mã hoặc tên đợt sinh đề..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="w-48">
        <Select 
          value={filters.subjectId || 'all'} 
          onValueChange={(val) => onFilterChange({ ...filters, subjectId: val === 'all' ? undefined : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn môn học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả môn học</SelectItem>
            {subjects.map(sub => (
              <SelectItem key={sub.id} value={sub.id}>{sub.subjectName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-48">
        <Select 
          value={filters.courseId || 'all'} 
          onValueChange={(val) => onFilterChange({ ...filters, courseId: val === 'all' ? undefined : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Đối tượng thi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả đối tượng</SelectItem>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={handleClear}>
        Xóa lọc
      </Button>
    </div>
  );
};

export default ExamFilter;

