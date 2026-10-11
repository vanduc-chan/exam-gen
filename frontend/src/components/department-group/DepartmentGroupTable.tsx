import React from 'react';
import { DepartmentGroup } from '@/types/departmentGroup';
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

interface DepartmentGroupTableProps {
  groups: DepartmentGroup[];
  onEdit: (group: DepartmentGroup) => void;
  onDelete: (id: string) => void;
}

const DepartmentGroupTable: React.FC<DepartmentGroupTableProps> = ({ groups, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
      <Table className="min-w-[540px]">
        <TableHeader>
          <TableRow>
            <TableHead>Mã bộ môn</TableHead>
            <TableHead>Tên bộ môn</TableHead>
            <TableHead>Khoa trực thuộc</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className="font-medium">{group.code}</TableCell>
              <TableCell>{group.name}</TableCell>
              <TableCell>{group.departmentName}</TableCell>
              <TableCell>
                <Badge variant={group.isActive ? 'default' : 'secondary'}>
                  {group.isActive ? 'Hoạt động' : 'Đã khóa'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(group)} title="Chỉnh sửa tổ bộ môn">
                  <Pencil className="h-4 w-4 text-amber-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(group.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {groups.length === 0 && (
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

export default DepartmentGroupTable;
