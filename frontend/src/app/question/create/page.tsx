import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { questionService } from '@/services/questionService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import QuestionForm from '@/components/question/QuestionForm';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';

const QuestionCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('from');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subRes, catRes] = await Promise.all([
          subjectService.getAll(),
          courseService.getAll(),
        ]);
        setSubjects(subRes.data.filter(s => s.isActive !== false));
        setCourses(catRes.data);
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu phụ trợ');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await questionService.create(data);
      toast.success('Thêm câu hỏi thành công');
      navigate(fromUrl || '/questions');
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    toast.info('Đang tải file mẫu...');
    // Mock download action for now
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,MockTemplateData';
    link.download = 'Question_Template.xlsx';
    link.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.info(`Đang xử lý file ${file.name}...`);
    // Mock import action (Phase 6 or later)
    setTimeout(() => {
      toast.success('Import file thành công (Tính năng Demo)');
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      navigate('/questions');
    }, 1500);
  };

  if (loading) return <div className="p-4 sm:p-8">Đang tải...</div>;

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Thêm mới Câu hỏi</h2>
        {/* <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Tải file mẫu
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import từ file
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .doc, .docx" 
            onChange={handleImportFile}
          />
        </div> */}
      </div>
      <div className="bg-white p-6 rounded-md border">
        <QuestionForm
          subjects={subjects}
          courses={courses}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => navigate(fromUrl || '/questions')}
        />
      </div>
    </div>
  );
};

export default QuestionCreatePage;
