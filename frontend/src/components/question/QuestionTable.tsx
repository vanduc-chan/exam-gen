import React from 'react';
import { Question, QuestionType, DifficultyLevel } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface QuestionTableProps {
  questions: Question[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const getDifficultyLabel = (level: DifficultyLevel) => {
  switch (level) {
    case DifficultyLevel.EASY: return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Dễ</Badge>;
    case DifficultyLevel.MEDIUM: return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Trung bình</Badge>;
    case DifficultyLevel.HARD: return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Khó</Badge>;
    default: return level;
  }
};

const getTypeLabel = (type: QuestionType) => {
  switch (type) {
    case QuestionType.LY_THUYET: return 'Lý thuyết';
    case QuestionType.THUC_HANH: return 'Thực hành';
    case QuestionType.TU_LUAN: return 'Tự luận';
    case QuestionType.TINH_HUONG: return 'Tình huống';
    default: return type;
  }
};

const QuestionTable: React.FC<QuestionTableProps> = ({ 
  questions, selectedIds, onSelectAll, onSelectOne, onEdit, onDelete 
}) => {
  const allSelected = questions.length > 0 && selectedIds.length === questions.length;

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              <Checkbox 
                checked={allSelected} 
                onCheckedChange={(checked) => onSelectAll(!!checked)} 
              />
            </TableHead>
            <TableHead className="w-24">Mã CH</TableHead>
            <TableHead>Nội dung</TableHead>
            <TableHead>Môn học</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Độ khó</TableHead>
            <TableHead className="text-right w-24">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((q) => (
            <TableRow key={q.id}>
              <TableCell className="text-center">
                <Checkbox 
                  checked={selectedIds.includes(q.id)} 
                  onCheckedChange={(checked) => onSelectOne(q.id, !!checked)} 
                />
              </TableCell>
              <TableCell className="font-medium text-xs text-muted-foreground">{q.code}</TableCell>
              <TableCell>
                <div className="line-clamp-2" title={q.content}>
                  {q.content}
                </div>
              </TableCell>
              <TableCell>{q.subjectName}</TableCell>
              <TableCell>{getTypeLabel(q.type)}</TableCell>
              <TableCell>{getDifficultyLabel(q.difficultyLevel)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(q.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(q.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {questions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                Không tìm thấy câu hỏi nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuestionTable;
