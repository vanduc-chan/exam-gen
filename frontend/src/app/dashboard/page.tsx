import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '@/services/dashboardService';
import { examService } from '@/services/examService';
import { questionService } from '@/services/questionService';
import { Exam } from '@/types/exam';
import { QuestionType } from '@/types/question';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  HelpCircle,
  FileText,
  Plus,
  ArrowRight,
  Download,
  Clock,
  Layers,
  FileCheck,
  Database,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface QuestionTypeCount {
  type: QuestionType;
  label: string;
  count: number;
  color: string;
  bgLight: string;
  barColor: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [typeCounts, setTypeCounts] = useState<QuestionTypeCount[]>([
    { type: QuestionType.LY_THUYET, label: 'Lý thuyết', count: 0, color: 'text-blue-600', bgLight: 'bg-blue-50', barColor: 'bg-blue-600' },
    { type: QuestionType.THUC_HANH, label: 'Thực hành', count: 0, color: 'text-emerald-600', bgLight: 'bg-emerald-50', barColor: 'bg-emerald-600' },
    { type: QuestionType.TU_LUAN, label: 'Tự luận', count: 0, color: 'text-amber-600', bgLight: 'bg-amber-50', barColor: 'bg-amber-500' },
    { type: QuestionType.TINH_HUONG, label: 'Tình huống', count: 0, color: 'text-purple-600', bgLight: 'bg-purple-50', barColor: 'bg-purple-600' },
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch main stats
      const statsPromise = dashboardService.getStats();

      // 2. Fetch recent exams
      const recentExamsPromise = examService.getExams({ page: 0, size: 5 });

      // 3. Fetch question type counts concurrently
      const typePromises = [
        questionService.getQuestions({ size: 1, type: QuestionType.LY_THUYET }),
        questionService.getQuestions({ size: 1, type: QuestionType.THUC_HANH }),
        questionService.getQuestions({ size: 1, type: QuestionType.TU_LUAN }),
        questionService.getQuestions({ size: 1, type: QuestionType.TINH_HUONG }),
      ];

      const [statsRes, examsRes, ...typeResList] = await Promise.all([
        statsPromise,
        recentExamsPromise,
        ...typePromises,
      ]);

      setStats(statsRes.data || {});
      setRecentExams(examsRes.data?.content || []);

      const counts = [
        { type: QuestionType.LY_THUYET, label: 'Lý thuyết', count: typeResList[0]?.data?.totalElements || 0, color: 'text-blue-600', bgLight: 'bg-blue-50', barColor: 'bg-blue-600' },
        { type: QuestionType.THUC_HANH, label: 'Thực hành', count: typeResList[1]?.data?.totalElements || 0, color: 'text-emerald-600', bgLight: 'bg-emerald-50', barColor: 'bg-emerald-600' },
        { type: QuestionType.TU_LUAN, label: 'Tự luận', count: typeResList[2]?.data?.totalElements || 0, color: 'text-amber-600', bgLight: 'bg-amber-50', barColor: 'bg-amber-500' },
        { type: QuestionType.TINH_HUONG, label: 'Tình huống', count: typeResList[3]?.data?.totalElements || 0, color: 'text-purple-600', bgLight: 'bg-purple-50', barColor: 'bg-purple-600' },
      ];
      setTypeCounts(counts);

      if (isManualRefresh) {
        toast.success('Đã cập nhật số liệu mới nhất');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Không thể tải toàn bộ dữ liệu thống kê');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const totalQuestions = useMemo(() => {
    return stats.questions || typeCounts.reduce((acc, curr) => acc + curr.count, 0) || 1;
  }, [stats.questions, typeCounts]);

  const handleExportWord = async (e: React.MouseEvent, examId: string, examCode: string, includeAnswers: boolean = false) => {
    e.stopPropagation();
    const toastId = toast.loading(includeAnswers ? 'Đang xuất file Word kèm đáp án...' : 'Đang xuất file đề thi Word...');
    try {
      const blob = await examService.exportToWord(examId, includeAnswers);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${examCode || 'exam'}_${includeAnswers ? 'answer' : 'question'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(includeAnswers ? 'Tải xuống đáp án thành công' : 'Tải xuống đề thi thành công', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xuất tài liệu Word', { id: toastId });
    }
  };

  const statCards = [
    {
      title: 'Khoa',
      subtitle: 'Đơn vị đào tạo',
      value: stats.departments || 0,
      icon: Building2,
      path: '/departments',
      gradient: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-100 text-blue-800',
      shadow: 'hover:shadow-blue-200',
    },
    {
      title: 'Tổ bộ môn',
      subtitle: 'Bộ môn trực thuộc',
      value: stats.departmentGroups || 0,
      icon: Users,
      path: '/department-groups',
      gradient: 'from-indigo-600 to-purple-700',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      shadow: 'hover:shadow-indigo-200',
    },
    {
      title: 'Môn học',
      subtitle: 'Học phần giảng dạy',
      value: stats.subjects || 0,
      icon: BookOpen,
      path: '/subjects',
      gradient: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      shadow: 'hover:shadow-emerald-200',
    },
    {
      title: 'Đối tượng thi',
      subtitle: 'Khóa / Chuyên ban',
      value: stats.courses || 0,
      icon: GraduationCap,
      path: '/courses',
      gradient: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-100 text-amber-800',
      shadow: 'hover:shadow-amber-200',
    },
    {
      title: 'Ngân hàng câu hỏi',
      subtitle: 'Câu hỏi hoạt động',
      value: stats.questions || 0,
      icon: HelpCircle,
      path: '/questions',
      gradient: 'from-violet-600 to-fuchsia-700',
      badgeBg: 'bg-violet-100 text-violet-800',
      shadow: 'hover:shadow-violet-200',
    },
    {
      title: 'Đợt sinh đề',
      subtitle: 'Bộ đề thi đã tạo',
      value: stats.exams || 0,
      icon: FileText,
      path: '/exams',
      gradient: 'from-rose-600 to-red-700',
      badgeBg: 'bg-rose-100 text-rose-800',
      shadow: 'hover:shadow-rose-200',
    },
  ];

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-6 max-w-full">
      {/* Top Hero Banner */}

      {/* KPI Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Tổng quan
          </h2>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {statCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                className={`group cursor-pointer rounded-xl bg-white p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient}`} />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">{item.title}</span>
                    <div className={`p-2 rounded-lg bg-slate-50 text-slate-700 group-hover:bg-slate-100 transition-colors`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? (
                      <div className="h-8 w-14 bg-slate-100 animate-pulse rounded" />
                    ) : (
                      item.value.toLocaleString('vi-VN')
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                  <span>Quản lý</span>
                  <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Section: Recent Exams & Question Type Breakdown */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Recent Exam Generation Activities (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Đợt sinh đề gần đây
                </CardTitle>
                <CardDescription className="text-xs">
                  5 đợt sinh đề thi mới nhất và xuất bản tài liệu Word
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/exams')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Xem tất cả ({stats.exams || 0})
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">Đang tải danh sách đợt sinh đề...</div>
              ) : recentExams.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-500">Chưa có đợt sinh đề nào được tạo trong hệ thống</p>
                  <Button size="sm" onClick={() => navigate('/exams/generate')}>
                    <Sparkles className="mr-2 h-4 w-4" /> Tạo đợt sinh đề đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentExams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => navigate(`/exams/edit/${exam.id}`)}
                      className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {exam.code}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {exam.title}
                          </span>
                          {exam.status === 'EXPORTED' ? (
                            <Badge variant="default" className="bg-emerald-600 text-[10px] py-0 px-1.5 h-5">
                              Đã xuất file
                            </Badge>
                          ) : exam.status === 'GENERATED' ? (
                            <Badge variant="default" className="bg-blue-600 text-[10px] py-0 px-1.5 h-5">
                              Đã sinh đề
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
                              Bản nháp
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="font-medium text-slate-700">{exam.subjectName}</span>
                          <span>•</span>
                          <span>{exam.numberOfExams} đề thi</span>
                          <span>•</span>
                          <span>{exam.durationMinutes} phút</span>
                          {exam.createdAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(exam.createdAt).toLocaleDateString('vi-VN')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quick Export Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                          title="Tải xuống đề thi Word"
                          onClick={(e) => handleExportWord(e, exam.id, exam.code, false)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5 text-blue-600" />
                          Đề thi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                          title="Tải xuống đề thi kèm đáp án"
                          onClick={(e) => handleExportWord(e, exam.id, exam.code, true)}
                        >
                          <FileCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                          Đáp án
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Question Bank Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Database className="h-4 w-4 text-violet-600" />
                  Cơ cấu Ngân hàng câu hỏi
                </CardTitle>
                <CardDescription className="text-xs">
                  Phân loại câu hỏi theo các nhóm hình thức thi
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/questions')}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                Ngân hàng
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Tổng số câu hỏi trong kho</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {stats.questions?.toLocaleString('vi-VN') || 0}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/questions/create')}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Thêm câu hỏi
                </Button>
              </div>

              {/* Progress bars by question type */}
              <div className="space-y-3">
                {typeCounts.map((item) => {
                  const percentage = totalQuestions > 0 ? Math.round((item.count / totalQuestions) * 100) : 0;
                  return (
                    <div
                      key={item.type}
                      onClick={() => navigate(`/questions?type=${item.type}`)}
                      className="group cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                        <span className="text-slate-700 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.barColor}`} />
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.count} câu</span>
                          <span className="text-slate-400 font-normal">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                          style={{ width: `${Math.max(percentage, item.count > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
