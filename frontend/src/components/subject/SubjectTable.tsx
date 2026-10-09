import React from 'react';
import { Subject } from '@/types/subject';
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

interface SubjectTableProps {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

const SubjectTable: React.FC<SubjectTableProps> = ({ subjects, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã môn học</TableHead>
            <TableHead>Tên môn học</TableHead>
            <TableHead>Tổ bộ môn trực thuộc</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.subjectCode}</TableCell>
              <TableCell>{subject.subjectName}</TableCell>
              <TableCell>{subject.departmentGroupName}</TableCell>
              <TableCell>{subject.description}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(subject)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(subject.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {subjects.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubjectTable;
