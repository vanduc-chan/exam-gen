import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionService } from '@/services/questionService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import QuestionForm from '@/components/question/QuestionForm';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { toast } from 'sonner';

const QuestionEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [initialData, setInitialData] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const [qRes, subRes, catRes] = await Promise.all([
          questionService.getById(id),
          subjectService.getAll(),
          courseService.getAll(),
        ]);
        setInitialData(qRes.data);
        setSubjects(subRes.data.filter(s => s.isActive !== false));
        setCourses(catRes.data);
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu câu hỏi');
        navigate('/questions');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (id) {
        await questionService.update(id, data);
        toast.success('Cập nhật câu hỏi thành công');
        navigate('/questions');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Đang tải...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Cập nhật Câu hỏi</h2>
      <div className="bg-white p-6 rounded-md border">
        <QuestionForm 
          initialData={initialData}
          subjects={subjects} 
          courses={courses} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      </div>
    </div>
  );
};

export default QuestionEditPage;
