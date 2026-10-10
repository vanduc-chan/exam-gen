import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layout
import MainLayout from '@/components/layout/MainLayout';
// Placeholder pages
import Dashboard from '@/app/dashboard/page';
import DepartmentPage from '@/app/department/page';
import DepartmentGroupPage from '@/app/department-group/page';
import SubjectPage from '@/app/subject/page';
import CoursePage from '@/app/course/page';
import QuestionListPage from '@/app/question/page';
import QuestionCreatePage from '@/app/question/create/page';
import QuestionEditPage from '@/app/question/edit/page';
import ExamPage from '@/app/exam/page';
import ExamGeneratePage from '@/app/exam/generate/page';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton duration={3500} />
      <Routes>
        <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/departments" element={<MainLayout><DepartmentPage /></MainLayout>} />
        <Route path="/department-groups" element={<MainLayout><DepartmentGroupPage /></MainLayout>} />
        <Route path="/subjects" element={<MainLayout><SubjectPage /></MainLayout>} />
        <Route path="/courses" element={<MainLayout><CoursePage /></MainLayout>} />
        <Route path="/questions" element={<MainLayout><QuestionListPage /></MainLayout>} />
        <Route path="/questions/create" element={<MainLayout><QuestionCreatePage /></MainLayout>} />
        <Route path="/questions/edit/:id" element={<MainLayout><QuestionEditPage /></MainLayout>} />
        <Route path="/exams" element={<MainLayout><ExamPage /></MainLayout>} />
        <Route path="/exams/generate" element={<MainLayout><ExamGeneratePage /></MainLayout>} />
        {/* We will add more routes here in subsequent phases */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
