import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { MultiSelect } from '@/components/ui/multi-select';
import { Upload, X, File, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { questionService } from '@/services/questionService';

interface QuestionImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  courses: Course[];
  onSuccess: () => void;
}

const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  open,
  onOpenChange,
  subjects,
  courses,
  onSuccess
}) => {
  const [subjectId, setSubjectId] = useState<string>('');
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast.error("Định dạng file không hợp lệ. Vui lòng chọn file .xlsx, .xls hoặc .csv");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File quá lớn. Vui lòng chọn file dưới 10MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        setFile(selectedFile);
      } else {
        toast.error("Định dạng file không hợp lệ.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!subjectId) {
      toast.error('Vui lòng chọn môn học');
      return;
    }
    if (courseIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đối tượng');
      return;
    }
    if (!file) {
      toast.error('Vui lòng chọn file');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subjectId);
      courseIds.forEach(id => formData.append('courseIds', id));
      formData.append('type', 'TU_LUAN'); // default
      formData.append('difficultyLevel', 'EASY'); // default

      // assuming questionService.importExcel accepts FormData
      await questionService.importExcel(formData);
      toast.success('Nhập câu hỏi thành công');
      onSuccess();
      onOpenChange(false);
      setFile(null);
      setSubjectId('');
      setCourseIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Lỗi khi nhập câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Nhập câu hỏi từ file Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Môn học */}
          <div className="space-y-2">
            <Label className="text-base">Chọn môn học</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn học để gán câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base">Chọn đối tượng (Course)</Label>
            <MultiSelect
              options={courses.map(c => ({ value: c.id, label: c.name }))}
              value={courseIds}
              onChange={setCourseIds}
              placeholder="Chọn đối tượng..."
            />
          </div>

          {/* Chọn file */}
          <div className="space-y-2">
            <Label className="text-base">Chọn file</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center space-x-2 text-primary">
                  <FileSpreadsheet className="h-6 w-6" />
                  <span className="font-medium">{file.name}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-4 text-muted-foreground w-full px-4">
                  <File className="h-5 w-5 opacity-50" />
                  <span className="flex-1 text-sm">Kéo thả file vào đây hoặc nhấp để chọn</span>
                  <Button variant="outline" size="sm" type="button" className="pointer-events-none">
                    <Upload className="mr-2 h-4 w-4" /> Duyệt file
                  </Button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls, .csv"
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
              <span>Hỗ trợ: .xlsx, .xls, .csv (Tối đa 10MB)</span>
              <a href="/Question_Import_Example.xlsx" download className="hover:underline flex items-center">
                <Upload className="mr-1 h-3 w-3" /> Tải file mẫu
              </a>
            </div>
          </div>

          {/* Accordion định dạng file */}
          <Accordion type="single" collapsible className="w-full border rounded-md px-4">
            <AccordionItem value="format" className="border-b-0">
              <AccordionTrigger className="hover:no-underline text-sm font-medium py-3">
                Xem định dạng các cột trong file
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1 pb-4">
                <p>• Cột A: Câu hỏi (Nội dung câu hỏi)</p>
                <p>• Cột B: Đáp án (Nội dung đáp án, hỗ trợ Alt+Enter xuống dòng)</p>
                <div className="bg-slate-50 p-2 rounded border mt-2 text-xs">
                  <span className="font-semibold text-slate-800">💡 Mẹo nhập đáp án tự động thụt lề đẹp mắt:</span>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-600">
                    <li>Dòng 1: Tiêu đề đáp án (Hệ thống tự động in đậm)</li>
                    <li>Dòng bắt đầu bằng <code className="bg-slate-200 px-1">a)</code>, <code className="bg-slate-200 px-1">b)</code>: Tên mục/các bước (Thụt lề 0.25 inch)</li>
                    <li>Dòng bắt đầu bằng dấu <code className="bg-slate-200 px-1">-</code>: Nội dung chi tiết / các bước B1, B2 (Thụt lề sâu 0.5 inch y như mẫu Word)</li>
                  </ul>
                </div>
                <p className="italic text-xs mt-2">* Các thông tin khác như môn học, độ khó, đối tượng sẽ được áp dụng chung từ form này.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Nhập câu hỏi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionImportModal;
