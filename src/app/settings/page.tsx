'use client';

import { useState } from 'react';
import { Save, Download, Upload, Bell, Palette, Globe } from 'lucide-react';
import { mockUserSettings } from '@/lib/mock';
import SectionWrapper from '@/components/SectionWrapper';
import UIButton from '@/components/UIButton';

export default function SettingsPage() {
  const [settings] = useState(mockUserSettings);

  return (
    <main className="relative">
      <SectionWrapper className="overflow-hidden">
        <div className="relative z-20 mx-auto max-w-4xl px-6">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Settings
            </h1>
            <p className="text-lg text-muted-foreground">
              Customize your Sakurimo experience and manage your preferences.
            </p>
          </div>

          <div className="space-y-8">
            {/* Profile Settings */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">University</label>
                  <input
                    type="text"
                    defaultValue={settings.university}
                    className="w-full px-3 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Student ID</label>
                  <input
                    type="text"
                    defaultValue={settings.studentId}
                    className="w-full px-3 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Academic Year</label>
                  <input
                    type="text"
                    defaultValue={settings.academicYear}
                    className="w-full px-3 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Semester</label>
                  <select
                    defaultValue={settings.semester}
                    className="w-full px-3 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    <option value="semester1">Semester 1</option>
                    <option value="semester2">Semester 2</option>
                    <option value="summer">Summer</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Theme Settings */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
                  <select
                    defaultValue={settings.theme}
                    className="w-full px-3 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                  <select
                    defaultValue={settings.timezone}
                    className="w-full px-3 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    <option value="Australia/Brisbane">Australia/Brisbane</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                    <option value="Australia/Melbourne">Australia/Melbourne</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={settings.notifications.email}
                    className="h-4 w-4 text-brand focus:ring-brand border-border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Assignment Reminders</p>
                    <p className="text-sm text-muted-foreground">Get reminded about upcoming assignments</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={settings.notifications.assignmentReminders}
                    className="h-4 w-4 text-brand focus:ring-brand border-border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Exam Reminders</p>
                    <p className="text-sm text-muted-foreground">Get reminded about upcoming exams</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={settings.notifications.examReminders}
                    className="h-4 w-4 text-brand focus:ring-brand border-border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Grade Updates</p>
                    <p className="text-sm text-muted-foreground">Get notified when grades are posted</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={settings.notifications.gradeUpdates}
                    className="h-4 w-4 text-brand focus:ring-brand border-border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Data Management
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Export Data</p>
                    <p className="text-sm text-muted-foreground">Download your data as JSON</p>
                  </div>
                  <UIButton variant="secondary" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </UIButton>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Import Data</p>
                    <p className="text-sm text-muted-foreground">Import data from a JSON file</p>
                  </div>
                  <UIButton variant="secondary" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import
                  </UIButton>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <UIButton variant="primary" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </UIButton>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
