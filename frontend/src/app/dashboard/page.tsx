import React, { useEffect, useState } from 'react';
import { dashboardService } from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, BookOpen, GraduationCap, HelpCircle, FileText } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await dashboardService.getStats();
        setStats(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const statItems = [
    { title: 'Khoa', value: stats.departments || 0, icon: Building2, color: 'text-blue-500' },
    { title: 'Tổ bộ môn', value: stats.departmentGroups || 0, icon: Users, color: 'text-indigo-500' },
    { title: 'Môn học', value: stats.subjects || 0, icon: BookOpen, color: 'text-green-500' },
    { title: 'Đối tượng thi', value: stats.courses || 0, icon: GraduationCap, color: 'text-orange-500' },
    { title: 'Ngân hàng câu hỏi', value: stats.questions || 0, icon: HelpCircle, color: 'text-purple-500' },
    { title: 'Đợt sinh đề', value: stats.exams || 0, icon: FileText, color: 'text-red-500' },
  ];

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-6 max-w-full">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Tổng quan hệ thống</h2>
      
      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statItems.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
