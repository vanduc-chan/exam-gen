import React from 'react';
import { Question, QuestionType } from '@/types/question';
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

const getTypeLabel = (type: QuestionType) => {
  switch (type) {
    case QuestionType.LY_THUYET: return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Lý thuyết</Badge>;
    case QuestionType.THUC_HANH: return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Thực hành</Badge>;
    case QuestionType.TU_LUAN: return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Tự luận</Badge>;
    case QuestionType.TINH_HUONG: return <Badge variant="outline" className="bg-cyan-100 text-cyan-800 border-cyan-200">Tình huống</Badge>;
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
            <TableHead className="w-[500px]">Nội dung</TableHead>
            <TableHead>Môn học</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Loại</TableHead>
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
              <TableCell className="max-w-[200px]">
                <div className="line-clamp-2" title={q.content}>
                  {q.content}
                </div>
              </TableCell>
              <TableCell>{q.subjectName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {q.courses && q.courses.length > 0 ? (
                    q.courses.map(c => (
                      <Badge key={c.id} variant="secondary" className="text-xs">
                        {c.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getTypeLabel(q.type)}</TableCell>
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
