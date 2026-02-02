'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { mockDashboardStats, mockUpcomingItems } from '@/lib/mock';
import { useStorage } from '@/lib/storageContext';
import { useSession } from '@/lib/supabase/SupabaseProvider';
import SectionWrapper from '@/components/SectionWrapper';
import UIButton from '@/components/UIButton';

export default function Dashboard() {
  const storage = useStorage();
  const { isLoading } = useSession();
  const [stats] = useState(mockDashboardStats);
  const [upcomingItems] = useState(mockUpcomingItems);
  const [storageStats, setStorageStats] = useState<{
    units: number;
    assignments: number;
    exams: number;
  } | null>(null);

  // Load synced counts from storage once session is ready
  useEffect(() => {
    if (isLoading) return;

    const loadStorageData = async () => {
      try {
        const [units, assignments, exams] = await Promise.all([
          storage.listUnits(),
          storage.listAssignments(),
          storage.listExams(),
        ]);

        setStorageStats({
          units: units.length,
          assignments: assignments.length,
          exams: exams.length,
        });
      } catch {
        setStorageStats({ units: 0, assignments: 0, exams: 0 });
      }
    };

    loadStorageData();
  }, [storage, isLoading]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <main className="relative">
      <SectionWrapper className="overflow-hidden">
        <div className="relative z-20 mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Welcome back! 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              Here&apos;s what&apos;s happening with your academic journey today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Assignments</p>
                  <p className="text-2xl font-bold text-foreground">{stats.upcomingAssignments}</p>
                </div>
                <BookOpen className="h-8 w-8 text-brand" />
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-foreground">{stats.overdueAssignments}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Exams</p>
                  <p className="text-2xl font-bold text-foreground">{stats.upcomingExams}</p>
                </div>
                <Calendar className="h-8 w-8 text-brand" />
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current GPA</p>
                  <p className="text-2xl font-bold text-foreground">{stats.currentGPA?.toFixed(1) || 'N/A'}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Synced data indicator */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {storageStats === null
                ? 'Syncing…'
                : `Synced: ${storageStats.units} units, ${storageStats.assignments} assignments, ${storageStats.exams} exams`}
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Due Soon</h2>
                <UIButton variant="secondary" className="text-sm px-3 py-1">
                  View All
                </UIButton>
              </div>
              
              <div className="space-y-3">
                {upcomingItems.map((item) => (
                  <div key={item.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 hover:bg-card/70 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.unitCode}</span>
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.dueAt)} • {item.type}
                        </p>
                      </div>
                      <div className="ml-4">
                        {item.type === 'assignment' ? (
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Today&apos;s Schedule</h2>
                <UIButton variant="secondary" className="text-sm px-3 py-1">
                  View Calendar
                </UIButton>
              </div>
              
              <div className="space-y-3">
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand rounded-full"></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">COMP3506 Lecture</h3>
                      <p className="text-sm text-muted-foreground">10:00 AM - 11:00 AM</p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Study Group - Algorithms</h3>
                      <p className="text-sm text-muted-foreground">6:00 PM - 8:00 PM</p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UIButton variant="primary" className="h-16 flex items-center justify-center gap-2">
                <BookOpen className="h-5 w-5" />
                Add Assignment
              </UIButton>
              <UIButton variant="secondary" className="h-16 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Study Session
              </UIButton>
              <UIButton variant="secondary" className="h-16 flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                View Grades
              </UIButton>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
