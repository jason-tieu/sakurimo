'use client';

import { useState } from 'react';
import { TrendingUp, Plus, Search, Filter, BookOpen, Award } from 'lucide-react';
import { mockUnitGrades, mockUnits } from '@/lib/mock';
import { UnitGrade, GradeItem } from '@/lib/types';
import SectionWrapper from '@/components/SectionWrapper';
import UIButton from '@/components/UIButton';

export default function GradesPage() {
  const [unitGrades] = useState(mockUnitGrades);
  const [units] = useState(mockUnits);
  const [searchTerm, setSearchTerm] = useState('');

  const getUnitInfo = (unitId: string) => {
    return units.find(unit => unit.id === unitId);
  };

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.7) return 'text-green-500';
    if (gpa >= 3.0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLetterGradeColor = (letterGrade: string) => {
    if (letterGrade.startsWith('A')) return 'text-green-500';
    if (letterGrade.startsWith('B')) return 'text-yellow-500';
    if (letterGrade.startsWith('C')) return 'text-orange-500';
    return 'text-red-500';
  };

  const filteredGrades = unitGrades.filter((grade: UnitGrade) => {
    const unit = getUnitInfo(grade.unitId);
    return unit && (
      unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.code ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const overallGPA = unitGrades.length > 0 
    ? unitGrades.reduce((sum: number, grade: UnitGrade) => sum + (grade.gpa || 0), 0) / unitGrades.length
    : 0;

  return (
    <main className="relative">
      <SectionWrapper className="overflow-hidden">
        <div className="relative z-20 mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Grades & Progress
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your academic performance and grade breakdowns.
            </p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall GPA</p>
                  <p className={`text-3xl font-bold ${getGpaColor(overallGPA)}`}>
                    {overallGPA.toFixed(2)}
                  </p>
                </div>
                <Award className="h-8 w-8 text-brand" />
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Units</p>
                  <p className="text-3xl font-bold text-foreground">{unitGrades.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-brand" />
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Grade</p>
                  <p className="text-3xl font-bold text-foreground">
                    {unitGrades.length > 0 
                      ? (unitGrades.reduce((sum: number, grade: UnitGrade) => sum + (grade.currentGrade || 0), 0) / unitGrades.length).toFixed(1)
                      : 'N/A'
                    }%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-brand" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <UIButton variant="secondary" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </UIButton>
            <UIButton variant="primary" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Grade
            </UIButton>
          </div>

          {/* Unit Grades */}
          <div className="space-y-6">
            {filteredGrades.map((grade: UnitGrade) => {
              const unit = getUnitInfo(grade.unitId);
              if (!unit) return null;

              return (
                <div key={grade.unitId} className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{unit.code}</h3>
                      <p className="text-muted-foreground">{unit.title}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getGpaColor(grade.gpa || 0)}`}>
                        {grade.currentGrade?.toFixed(1)}%
                      </div>
                      <div className={`text-sm font-medium ${getLetterGradeColor(grade.letterGrade || '')}`}>
                        {grade.letterGrade || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        GPA: {grade.gpa?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Grade Items */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Grade Breakdown</h4>
                    {grade.items.map((item: GradeItem) => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.weightPct}% of grade)
                          </span>
                        </div>
                        <div className="text-right">
                          {item.status === 'graded' ? (
                            <span className="text-sm font-medium text-foreground">
                              {item.score}/{item.maxScore} ({item.weightPct}%)
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {item.status === 'pending' ? 'Pending' : 'Excused'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGrades.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No grades found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'Try adjusting your search terms.' : 'No grades recorded yet.'}
              </p>
              <UIButton variant="primary" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Grade
              </UIButton>
            </div>
          )}
        </div>
      </SectionWrapper>
    </main>
  );
}
