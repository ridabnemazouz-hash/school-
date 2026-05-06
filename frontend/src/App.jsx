import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OwnerDashboardLayout } from './components/layout/OwnerDashboardLayout';
import { SmartRedirect } from './components/SmartRedirect';
import { Login } from './pages/Login';
import { DashboardHome } from './pages/Dashboard/DashboardHome';
import { OwnerDashboard } from './pages/Dashboard/OwnerDashboard';
import { Admins } from './pages/Admins';
import { Students } from './pages/Students';
import { StudentProfile } from './pages/StudentProfile';
import { Teachers } from './pages/Teachers';
import { TeacherProfile } from './pages/TeacherProfile';
import { Parents } from './pages/Parents';
import { Classes } from './pages/Classes';
import { Subjects } from './pages/Subjects';
import { Transport } from './pages/Transport';
import { Payments } from './pages/Payments';
import { Register } from './pages/Register';
import { Accounts } from './pages/Accounts';
import { Chat } from './pages/Chat';
import { Grades } from './pages/Grades';
import { Planning } from './pages/Planning';
import { Attendance } from './pages/Attendance';
import { Content } from './pages/Content';
import { Settings } from './pages/Settings';
import { MyClasses } from './pages/MyClasses';
import { MyStudents } from './pages/MyStudents';
import { AITutor } from './pages/AITutor';
import { Expenses } from './pages/Expenses';
import { TeacherSalaries } from './pages/TeacherSalaries';
import { SecurityLogs } from './pages/SecurityLogs';
import { SecurityCenter } from './pages/SecurityCenter';
import { BackupsManager } from './pages/BackupsManager';
import { BillingAnalytics } from './pages/BillingAnalytics';
import { IntegrationsHub } from './pages/IntegrationsHub';
import { VideoRooms } from './pages/VideoRooms';
import { Schools } from './pages/Schools';
import { DevDB } from './pages/DevDB';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<SmartRedirect />} />

          {/* Platform Owner Routes - Manages SCHOOLS ONLY */}
          <Route path="/" element={<OwnerDashboardLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="schools" element={<Schools />} />
            <Route path="security-center" element={<SecurityCenter />} />
            <Route path="backups" element={<BackupsManager />} />
            <Route path="billing" element={<BillingAnalytics />} />
            <Route path="integrations" element={<IntegrationsHub />} />
            <Route path="security" element={<SecurityLogs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="dev-db" element={<DevDB />} />
          </Route>

          {/* School Admin Routes */}
          <Route path="/school" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="admins" element={<Admins />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="security" element={<SecurityLogs />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="teachers/:id" element={<TeacherProfile />} />
            <Route path="parents" element={<Parents />} />
            <Route path="classes" element={<Classes />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="transport" element={<Transport />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="salaries" element={<TeacherSalaries />} />
            <Route path="my-classes" element={<MyClasses />} />
            <Route path="my-students" element={<MyStudents />} />
            <Route path="planning" element={<Planning />} />
            <Route path="ai-tutor" element={<AITutor />} />
            <Route path="grades" element={<Grades />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="content" element={<Content />} />
            <Route path="chat" element={<Chat />} />
            <Route path="payments" element={<Payments />} />
            <Route path="rooms" element={<VideoRooms />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const Placeholder = ({ title }) => (
  <div className="h-full flex items-center justify-center">
    <h1 className="text-2xl font-semibold text-slate-400">{title} — Coming soon</h1>
  </div>
);

export default App;
