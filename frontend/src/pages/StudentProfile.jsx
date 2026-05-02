import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Loader, Mail, Calendar, GraduationCap, Award, Activity, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import API from '../config';

export function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchStudent(); }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/students/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      } else {
        setError('Failed to load student profile');
      }
    } catch {
      setError('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-mauve-500" size={32} />
        <span className="ml-3 text-slate-500">Loading...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
          <ArrowLeft size={16} className="mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const avatar = student.avatar_url
    ? `${API}${student.avatar_url}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=128`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{student.name}</h1>
          <p className="text-slate-500">Student Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <img
            src={avatar}
            alt={student.name}
            className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
          />
          <h2 className="text-xl font-bold text-slate-800 mt-4">{student.name}</h2>
          {student.email && (
            <div className="flex items-center justify-center gap-2 text-slate-500 mt-2">
              <Mail size={14} />
              <span className="text-sm">{student.email}</span>
            </div>
          )}
          <div className="mt-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {student.status || 'Active'}
            </span>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <GraduationCap size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Class</p>
                <p className="font-medium text-slate-800">{student.class || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Award size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Grade</p>
                <p className="font-medium text-slate-800">{student.grade || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Activity size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Attendance</p>
                <p className="font-medium text-slate-800">{student.attendance || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Award size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">GPA</p>
                <p className="font-medium text-slate-800">{student.gpa || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <Calendar size={20} className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Date of Birth</p>
                <p className="font-medium text-slate-800">{student.date_of_birth || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Clock size={20} className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Added Date</p>
                <p className="font-medium text-slate-800">{student.created_at || 'N/A'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
