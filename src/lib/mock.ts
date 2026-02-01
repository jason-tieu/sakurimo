import { 
  Unit,
  Assignment, 
  Exam, 
  Announcement, 
  StudyTask, 
  Event, 
  GradeItem, 
  UnitGrade,
  StudySession,
  Resource,
  Integration,
  Notification,
  UserSettings,
  DashboardStats,
  UpcomingItem
} from './types';

// Mock data for development and testing

const baseUnit = {
  semester: null as number | null,
  year: null as number | null,
  term_display: null as string | null,
  unit_url: null as string | null,
  credits: null as number | null,
  description: null as string | null,
  canvas_course_id: null as number | null,
  updated_at: null as string | null,
};

export const mockUnits: Unit[] = [
  {
    id: '1',
    owner_id: 'mock-user-id',
    code: 'COMP3506',
    title: 'Algorithms & Data Structures',
    term: 'Semester 1, 2024',
    campus: 'St Lucia',
    url: 'https://learn.uq.edu.au/course/view.php?id=12345',
    instructor: 'Dr. Sarah Chen',
    created_at: '2024-01-15T10:00:00Z',
    ...baseUnit,
  },
  {
    id: '2',
    owner_id: 'mock-user-id',
    code: 'MATH2400',
    title: 'Mathematical Analysis',
    term: 'Semester 1, 2024',
    campus: 'St Lucia',
    url: null,
    instructor: 'Prof. Michael Rodriguez',
    created_at: '2024-01-15T10:00:00Z',
    ...baseUnit,
  },
  {
    id: '3',
    owner_id: 'mock-user-id',
    code: 'PHYS2020',
    title: 'Thermodynamics & Statistical Mechanics',
    term: 'Semester 1, 2024',
    campus: 'St Lucia',
    url: null,
    instructor: 'Dr. Emily Watson',
    created_at: '2024-01-15T10:00:00Z',
    ...baseUnit,
  }
];


export const mockAssignments: Assignment[] = [
  {
    id: '1',
    unitId: '1',
    title: 'Binary Search Tree Implementation',
    type: 'assignment',
    dueAt: new Date('2024-03-15T23:59:00'),
    status: 'in_progress',
    description: 'Implement a balanced binary search tree with insertion, deletion, and search operations.',
    weight: 15
  },
  {
    id: '2',
    unitId: '1',
    title: 'Algorithm Complexity Analysis',
    type: 'essay',
    dueAt: new Date('2024-03-20T23:59:00'),
    status: 'todo',
    description: 'Analyze the time and space complexity of various sorting algorithms.',
    weight: 10
  },
  {
    id: '3',
    unitId: '2',
    title: 'Limits and Continuity Proofs',
    type: 'assignment',
    dueAt: new Date('2024-03-18T23:59:00'),
    status: 'todo',
    description: 'Prove various theorems about limits and continuity using epsilon-delta definitions.',
    weight: 20
  },
  {
    id: '4',
    unitId: '3',
    title: 'Heat Engine Lab Report',
    type: 'lab',
    dueAt: new Date('2024-03-12T23:59:00'),
    status: 'submitted',
    grade: 85,
    maxGrade: 100,
    description: 'Analysis of heat engine efficiency and entropy calculations.',
    weight: 25
  }
];

export const mockExams: Exam[] = [
  {
    id: '1',
    unitId: '1',
    title: 'Midterm Exam - Algorithms',
    type: 'midterm',
    startsAt: new Date('2024-04-15T09:00:00'),
    endsAt: new Date('2024-04-15T11:00:00'),
    location: 'Building 78, Room 201',
    duration: 120,
    instructions: 'Closed book exam. Bring calculator and student ID.'
  },
  {
    id: '2',
    unitId: '2',
    title: 'Final Exam - Mathematical Analysis',
    type: 'final',
    startsAt: new Date('2024-06-10T14:00:00'),
    endsAt: new Date('2024-06-10T17:00:00'),
    location: 'Building 67, Room 105',
    duration: 180,
    instructions: 'Open book exam. All unit materials allowed.'
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    unitId: '1',
    title: 'Assignment 2 Extension Granted',
    body: 'Due to technical issues with the submission system, Assignment 2 deadline has been extended by 48 hours. New deadline: March 17th, 11:59 PM.',
    postedAt: new Date('2024-03-10T10:30:00'),
    priority: 'high',
    isRead: false
  },
  {
    id: '2',
    unitId: '2',
    title: 'Office Hours Change',
    body: 'Dr. Rodriguez\'s office hours have changed to Tuesdays 2-4 PM due to a scheduling conflict.',
    postedAt: new Date('2024-03-08T14:15:00'),
    priority: 'medium',
    isRead: true
  },
  {
    id: '3',
    title: 'University Library Extended Hours',
    body: 'During exam period, the library will be open 24/7. Please respect the quiet study areas.',
    postedAt: new Date('2024-03-05T09:00:00'),
    priority: 'low',
    isRead: false
  }
];

export const mockStudyTasks: StudyTask[] = [
  {
    id: '1',
    title: 'Review Binary Search Tree algorithms',
    unitId: '1',
    plannedAt: new Date('2024-03-14T19:00:00'),
    durationMin: 90,
    status: 'planned',
    priority: 'high',
    description: 'Go through textbook chapters 12-13 and practice problems.',
    tags: ['algorithms', 'data-structures']
  },
  {
    id: '2',
    title: 'Complete math problem set 5',
    unitId: '2',
    plannedAt: new Date('2024-03-16T15:00:00'),
    durationMin: 120,
    status: 'in_progress',
    priority: 'medium',
    description: 'Work through problems 1-15 in the problem set.',
    tags: ['calculus', 'proofs']
  }
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'COMP3506 Lecture',
    startsAt: new Date('2024-03-14T10:00:00'),
    endsAt: new Date('2024-03-14T11:00:00'),
    type: 'class',
    unitId: '1',
    location: 'Building 78, Room 201',
    recurring: {
      frequency: 'weekly',
      interval: 1,
      endDate: new Date('2024-06-14T11:00:00')
    }
  },
  {
    id: '2',
    title: 'MATH2400 Tutorial',
    startsAt: new Date('2024-03-15T14:00:00'),
    endsAt: new Date('2024-03-15T15:00:00'),
    type: 'tutorial',
    unitId: '2',
    location: 'Building 67, Room 105'
  },
  {
    id: '3',
    title: 'Study Group - Algorithms',
    startsAt: new Date('2024-03-16T18:00:00'),
    endsAt: new Date('2024-03-16T20:00:00'),
    type: 'study',
    location: 'Library Study Room 3A'
  }
];

export const mockGradeItems: GradeItem[] = [
  {
    id: '1',
    unitId: '1',
    name: 'Assignment 1 - Linked Lists',
    weightPct: 15,
    score: 92,
    maxScore: 100,
    dueDate: new Date('2024-02-15T23:59:00'),
    type: 'assignment',
    status: 'graded'
  },
  {
    id: '2',
    unitId: '1',
    name: 'Quiz 1 - Algorithm Analysis',
    weightPct: 10,
    score: 18,
    maxScore: 20,
    dueDate: new Date('2024-02-20T23:59:00'),
    type: 'quiz',
    status: 'graded'
  },
  {
    id: '3',
    unitId: '2',
    name: 'Problem Set 3',
    weightPct: 20,
    dueDate: new Date('2024-03-20T23:59:00'),
    type: 'assignment',
    status: 'pending'
  }
];

export const mockUnitGrades: UnitGrade[] = [
  {
    unitId: '1',
    currentGrade: 87.5,
    letterGrade: 'A-',
    gpa: 3.7,
    items: mockGradeItems.filter(item => item.unitId === '1'),
    lastUpdated: new Date('2024-03-10T12:00:00')
  },
  {
    unitId: '2',
    currentGrade: 82.0,
    letterGrade: 'B+',
    gpa: 3.3,
    items: mockGradeItems.filter(item => item.unitId === '2'),
    lastUpdated: new Date('2024-03-08T15:30:00')
  }
];

export const mockStudySessions: StudySession[] = [
  {
    id: '1',
    unitId: '1',
    title: 'BST Implementation Practice',
    startTime: new Date('2024-03-13T19:00:00'),
    endTime: new Date('2024-03-13T21:30:00'),
    duration: 150,
    type: 'focused',
    notes: 'Worked on insertion and deletion methods. Need to review balancing.',
    completed: true
  },
  {
    id: '2',
    unitId: '2',
    title: 'Calculus Review',
    startTime: new Date('2024-03-14T15:00:00'),
    duration: 60,
    type: 'pomodoro',
    completed: false
  }
];

export const mockResources: Resource[] = [
  {
    id: '1',
    unitId: '1',
    title: 'Introduction to Algorithms (CLRS) - Chapter 12',
    type: 'textbook',
    url: 'https://library.uq.edu.au/record=b1234567',
    description: 'Binary Search Trees chapter',
    tags: ['algorithms', 'textbook'],
    addedAt: new Date('2024-02-01T00:00:00')
  },
  {
    id: '2',
    unitId: '1',
    title: 'Lecture 8 - Balanced Trees',
    type: 'lecture_notes',
    url: 'https://learn.uq.edu.au/mod/resource/view.php?id=12345',
    description: 'Slides and notes from lecture on AVL trees',
    tags: ['lecture', 'slides'],
    addedAt: new Date('2024-03-01T00:00:00')
  },
  {
    id: '3',
    unitId: '2',
    title: 'Unit Discussion Forum',
    type: 'forum',
    url: 'https://learn.uq.edu.au/mod/forum/view.php?id=67890',
    description: 'Ask questions and discuss unit material',
    tags: ['forum', 'discussion'],
    addedAt: new Date('2024-02-15T00:00:00')
  }
];

export const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Canvas LMS',
    type: 'canvas',
    status: 'disconnected',
    settings: {}
  },
  {
    id: '2',
    name: 'Google Calendar',
    type: 'google_calendar',
    status: 'connected',
    lastSync: new Date('2024-03-14T08:25:00'),
    settings: { syncEvents: true, syncAssignments: false }
  },
  {
    id: '3',
    name: 'Blackboard',
    type: 'blackboard',
    status: 'disconnected',
    settings: {}
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Assignment Due Tomorrow',
    message: 'Binary Search Tree Implementation is due tomorrow at 11:59 PM',
    type: 'assignment_due',
    isRead: false,
    createdAt: new Date('2024-03-14T09:00:00'),
    unitId: '1',
    actionUrl: '/assignments/1'
  },
  {
    id: '2',
    title: 'Grade Posted',
    message: 'Your grade for Heat Engine Lab Report has been posted: 85/100',
    type: 'grade_posted',
    isRead: true,
    createdAt: new Date('2024-03-12T16:30:00'),
    unitId: '3',
    actionUrl: '/grades'
  },
  {
    id: '3',
    title: 'Exam Reminder',
    message: 'Midterm Exam - Algorithms is in 2 days (April 15, 9:00 AM)',
    type: 'exam_reminder',
    isRead: false,
    createdAt: new Date('2024-03-13T10:00:00'),
    unitId: '1',
    actionUrl: '/exams/1'
  }
];

export const mockUserSettings: UserSettings = {
  timezone: 'Australia/Brisbane',
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    assignmentReminders: true,
    examReminders: true,
    gradeUpdates: true
  },
  academicYear: '2024',
  semester: 'semester1',
  university: 'University of Queensland',
  studentId: '12345678'
};

export const mockDashboardStats: DashboardStats = {
  upcomingAssignments: 3,
  overdueAssignments: 0,
  upcomingExams: 1,
  currentGPA: 3.5,
  studyHoursThisWeek: 12,
  completedTasks: 8
};

export const mockUpcomingItems: UpcomingItem[] = [
  {
    id: '1',
    title: 'Binary Search Tree Implementation',
    type: 'assignment',
    dueAt: new Date('2024-03-15T23:59:00'),
    unitId: '1',
    unitCode: 'COMP3506',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Limits and Continuity Proofs',
    type: 'assignment',
    dueAt: new Date('2024-03-18T23:59:00'),
    unitId: '2',
    unitCode: 'MATH2400',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Midterm Exam - Algorithms',
    type: 'exam',
    dueAt: new Date('2024-04-15T09:00:00'),
    unitId: '1',
    unitCode: 'COMP3506',
    priority: 'high'
  }
];
