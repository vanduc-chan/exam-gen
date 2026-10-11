import React from 'react';
import { Exam } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Eye, FileText, FileCheck, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ExamTableProps {
  exams: Exam[];
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onExport: (id: string, includeAnswers?: boolean) => void;
  onEdit?: (id: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT': return <Badge variant="secondary">Bản nháp</Badge>;
    case 'GENERATED': return <Badge variant="default" className="bg-blue-500">Đã sinh đề</Badge>;
    case 'EXPORTED': return <Badge variant="default" className="bg-green-500">Đã xuất file</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

const ExamTable: React.FC<ExamTableProps> = ({ exams, onDelete, onView, onExport, onEdit }) => {
  return (
    <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
      <Table className="min-w-[850px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Mã Đợt</TableHead>
            <TableHead>Tên đợt sinh đề</TableHead>
            <TableHead>Môn học</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead className="text-center">Số đề</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-center">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam) => (
            <TableRow key={exam.id}>
              <TableCell className="font-medium text-xs text-muted-foreground">{exam.code}</TableCell>
              <TableCell className="font-medium">{exam.title}</TableCell>
              <TableCell>{exam.subjectName}</TableCell>
              <TableCell>{exam.courseName}</TableCell>
              <TableCell className="text-center">{exam.numberOfExams}</TableCell>
              <TableCell>{getStatusBadge(exam.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {exam.createdAt ? format(new Date(exam.createdAt), 'dd/MM/yyyy HH:mm') : ''}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(exam.id)} title="Chỉnh sửa đợt sinh đề">
                    <Pencil className="h-4 w-4 text-amber-600" />
                  </Button>
                )}
                {/* <Button variant="ghost" size="icon" onClick={() => onView(exam.id)} title="Xem chi tiết">
                  <Eye className="h-4 w-4" />
                </Button> */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title="Xuất file Word">
                      <Download className="h-4 w-4 text-blue-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onExport(exam.id, false)} className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4 text-blue-500" /> Xuất Đề thi (không đáp án)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(exam.id, true)} className="cursor-pointer">
                      <FileCheck className="mr-2 h-4 w-4 text-green-600" /> Xuất Đề thi (kèm đáp án)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" onClick={() => onDelete(exam.id)} title="Xóa">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {exams.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                Không tìm thấy đợt sinh đề nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExamTable;
