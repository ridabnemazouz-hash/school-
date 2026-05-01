import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { DashboardHome } from './pages/Dashboard/DashboardHome';
import { Admins } from './pages/Admins';
import { Students } from './pages/Students';
import { Payments } from './pages/Payments';
import { Register } from './pages/Register';
import { Accounts } from './pages/Accounts';
import { Chat } from './pages/Chat';
import { Grades } from './pages/Grades';
import { Planning } from './pages/Planning';

// Placeholder components for other routes
const Placeholder = ({ title }) => (
  <div className="h-full flex items-center justify-center">
    <h1 className="text-2xl font-semibold text-slate-400">{title} Component Placeholder</h1>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="admins" element={<Admins />} />
            
            {/* Admin Routes */}
            <Route path="students" element={<Students />} />
            <Route path="teachers" element={<Placeholder title="Teachers" />} />
            <Route path="parents" element={<Placeholder title="Parents" />} />
            <Route path="classes" element={<Placeholder title="Classes" />} />
            <Route path="subjects" element={<Placeholder title="Subjects" />} />
            <Route path="transport" element={<Placeholder title="Transport" />} />
            <Route path="accounts" element={<Accounts />} />

            {/* Teacher Routes */}
            <Route path="my-classes" element={<Placeholder title="My Classes" />} />
            <Route path="my-students" element={<Placeholder title="My Students" />} />

            {/* Student Routes */}
            <Route path="planning" element={<Planning />} />

            {/* Shared Routes */}
            <Route path="grades" element={<Grades />} />
            <Route path="attendance" element={<Placeholder title="Attendance" />} />
            <Route path="content" element={<Placeholder title="Lessons & Devoirs" />} />
            <Route path="chat" element={<Chat />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
