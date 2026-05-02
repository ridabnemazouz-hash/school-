export const FAKE_USERS = [
  { id: 1, name: 'Ahmed Super', role: 'Super Admin', email: 'super@school.com', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Karim Admin', role: 'Admin', email: 'admin@school.com', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Fatima Teacher', role: 'Teacher', email: 'teacher@school.com', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Youssef Student', role: 'Student', email: 'student@school.com', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, name: 'Nadia Parent', role: 'Parent', email: 'parent@school.com', avatar: 'https://i.pravatar.cc/150?u=5' },
];

export const FAKE_ADMINS = [
  { id: 1, name: 'Karim Admin', email: 'admin@school.com', status: 'Active', addedDate: '2023-09-01', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 2, name: 'Salma Manager', email: 'salma@school.com', status: 'Active', addedDate: '2023-11-15', avatar: 'https://i.pravatar.cc/150?u=8' },
  { id: 3, name: 'Rachid Ops', email: 'rachid@school.com', status: 'Inactive', addedDate: '2024-01-10', avatar: 'https://i.pravatar.cc/150?u=9' },
];

export const FAKE_STUDENTS = [
  { id: 1, name: 'Youssef Student', grade: '10th Grade', class: '10-A', attendance: '95%', gpa: '3.8' },
  { id: 2, name: 'Sara Lahlou', grade: '10th Grade', class: '10-B', attendance: '98%', gpa: '3.9' },
  { id: 3, name: 'Omar Bennis', grade: '11th Grade', class: '11-A', attendance: '92%', gpa: '3.5' },
];

export const FAKE_TEACHERS = [
  { id: 1, name: 'Fatima Teacher', subject: 'Mathematics', classes: ['10-A', '10-B', '11-A'] },
  { id: 2, name: 'Hassan Amrani', subject: 'Physics', classes: ['11-A', '12-A'] },
  { id: 3, name: 'Leila Tazi', subject: 'English', classes: ['10-A', '11-A', '12-A'] },
];

export const FAKE_PENDING_REQUESTS = [
  { id: 101, name: 'Anas Tazi', email: 'anas.tazi@email.com', role: 'Student', date: '2026-05-01 10:30', status: 'Pending' },
  { id: 102, name: 'Meryem Amrani', email: 'meryem.am@email.com', role: 'Parent', date: '2026-05-01 09:15', status: 'Pending' },
  { id: 103, name: 'Hicham Prof', email: 'hicham.prof@email.com', role: 'Teacher', date: '2026-04-30 14:20', status: 'Pending' },
];

export const STATS = {
  totalStudents: 1250,
  totalTeachers: 85,
  totalClasses: 42,
  averageAttendance: 96,
};
