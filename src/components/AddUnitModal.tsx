'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/custom-select';
import UIButton from '@/components/UIButton';
import { useStorage } from '@/lib/storageContext';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import { useToast } from '@/lib/toast';
import { Unit } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AddUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnitAdded: (unit: Unit) => void;
}

interface FormData {
  code: string;
  title: string;
  semester: string;
  year: string;
}

interface FormErrors {
  code?: string;
  title?: string;
  semester?: string;
  year?: string;
}

export function AddUnitModal({ open, onOpenChange, onUnitAdded }: AddUnitModalProps) {
  const storage = useStorage();
  const { user } = useSupabase();
  const { addToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    title: '',
    semester: '',
    year: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.code.trim()) {
      newErrors.code = 'Unit code is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Unit title is required';
    }
    if (!formData.semester) {
      newErrors.semester = 'Semester is required';
    }
    if (!formData.year) {
      newErrors.year = 'Year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please fix the errors below and try again.',
      });
      return;
    }

    if (!user) {
      addToast({
        type: 'error',
        title: 'Authentication Required',
        description: 'Please sign in to create units.',
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const semesterNum = Number(formData.semester);
      const yearNum = Number(formData.year);
      const unitData: Omit<Unit, 'id' | 'owner_id' | 'created_at'> = {
        platform: 'canvas',
        institution: 'QUT',
        external_id: `manual-${crypto.randomUUID()}`,
        code: formData.code.trim(),
        title: formData.title.trim(),
        year: Number.isNaN(yearNum) ? null : yearNum,
        semester: Number.isNaN(semesterNum) ? null : semesterNum,
        updated_at: null,
      };

      const newUnit = await storage.createUnit(unitData);
      
      addToast({
        type: 'success',
        title: 'Unit Added',
        description: `${newUnit.code} has been added successfully. ID: ${newUnit.id}`,
      });

      onUnitAdded(newUnit);
      handleClose();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Unit',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      code: '',
      title: '',
      semester: '',
      year: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand" />
            Add New Unit
          </DialogTitle>
          <DialogDescription>
            Create a new unit to track your academic progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-4">
            {/* Unit Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1">
                Unit Code <span className="text-red-500">*</span>
              </label>
              <Input
                id="code"
                type="text"
                placeholder="e.g., COMP3506"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className={errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? 'code-error' : undefined}
              />
              {errors.code && (
                <p id="code-error" className="text-sm text-red-500 mt-1">
                  {errors.code}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                Unit Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Algorithms & Data Structures"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-red-500 mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-foreground mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                id="semester"
                value={formData.semester}
                onChange={(value) => handleInputChange('semester', value)}
                placeholder="Select semester"
                className={cn(
                  'transition-all duration-200',
                  errors.semester && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!errors.semester}
                {...(errors.semester && { 'aria-describedby': 'semester-error' })}
                options={[
                  { value: '1', label: 'Semester 1' },
                  { value: '2', label: 'Semester 2' }
                ]}
              />
              {errors.semester && (
                <p id="semester-error" className="text-sm text-red-500 mt-1">
                  {errors.semester}
                </p>
              )}
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-foreground mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                id="year"
                value={formData.year}
                onChange={(value) => handleInputChange('year', value)}
                placeholder="Select year"
                className={cn(
                  'transition-all duration-200',
                  errors.year && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!errors.year}
                {...(errors.year && { 'aria-describedby': 'year-error' })}
                options={Array.from({ length: 6 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return {
                    value: year.toString(),
                    label: year.toString()
                  };
                })}
              />
              {errors.year && (
                <p id="year-error" className="text-sm text-red-500 mt-1">
                  {errors.year}
                </p>
              )}
            </div>

          </div>

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                Please fix the errors above before submitting.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <UIButton
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </UIButton>
            <UIButton
              variant="primary"
              className="flex-1"
              onClick={(e) => {
                handleSubmit(e);
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Unit
                </>
              )}
            </UIButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
