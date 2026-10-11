import React from 'react';
import { Department } from '@/types/department';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface DepartmentTableProps {
  departments: Department[];
  onEdit: (dept: Department) => void;
  onDelete: (id: string) => void;
}

const DepartmentTable: React.FC<DepartmentTableProps> = ({ departments, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
      <Table className="min-w-[540px]">
        <TableHeader>
          <TableRow>
            <TableHead>Mã khoa</TableHead>
            <TableHead>Tên khoa</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-medium">{dept.code}</TableCell>
              <TableCell>{dept.name}</TableCell>
              <TableCell>{dept.description}</TableCell>
              <TableCell>
                <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                  {dept.isActive ? 'Hoạt động' : 'Đã khóa'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(dept)} title="Chỉnh sửa khoa">
                  <Pencil className="h-4 w-4 text-amber-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(dept.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {departments.length === 0 && (
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

export default DepartmentTable;
