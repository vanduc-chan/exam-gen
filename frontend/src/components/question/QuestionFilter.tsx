import React from 'react';
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
import { QuestionType, DifficultyLevel } from '@/types/question';

interface QuestionFilterProps {
  subjects: Subject[];
  onFilterChange: (filters: any) => void;
  filters: {
    subjectId?: string;
    type?: QuestionType;
    level?: DifficultyLevel;
    search?: string;
  };
}

const QuestionFilter: React.FC<QuestionFilterProps> = ({ subjects, onFilterChange, filters }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-md border">
      <div className="flex-1">
        <Input 
          placeholder="Tìm kiếm mã hoặc nội dung..." 
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
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
      <div className="w-40">
        <Select 
          value={filters.type || 'all'} 
          onValueChange={(val) => onFilterChange({ ...filters, type: val === 'all' ? undefined : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Loại câu hỏi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value={QuestionType.LY_THUYET}>Lý thuyết</SelectItem>
            <SelectItem value={QuestionType.THUC_HANH}>Thực hành</SelectItem>
            <SelectItem value={QuestionType.TU_LUAN}>Tự luận</SelectItem>
            <SelectItem value={QuestionType.TINH_HUONG}>Tình huống</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-40">
        <Select 
          value={filters.level || 'all'} 
          onValueChange={(val) => onFilterChange({ ...filters, level: val === 'all' ? undefined : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Độ khó" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value={DifficultyLevel.EASY}>Dễ</SelectItem>
            <SelectItem value={DifficultyLevel.MEDIUM}>Trung bình</SelectItem>
            <SelectItem value={DifficultyLevel.HARD}>Khó</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={() => onFilterChange({})}>
        Xóa lọc
      </Button>
    </div>
  );
};

export default QuestionFilter;
