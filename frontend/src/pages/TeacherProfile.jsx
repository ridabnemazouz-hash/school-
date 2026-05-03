import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Loader, Mail, Calendar, BookOpen, Award, Clock, UserCheck } from 'lucide-react';
import API from '../config';

export function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchTeacher(); }, [id]);

  const fetchTeacher = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/users/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeacher(data);
      } else {
        setError('Failed to load teacher profile');
      }
    } catch {
      setError('Failed to load teacher profile');
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

  if (error || !teacher) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
          <ArrowLeft size={16} className="mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const avatar = teacher.avatar_url
    ? `${API}${teacher.avatar_url}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=7c3aed&color=fff&size=128`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{teacher.name}</h1>
          <p className="text-slate-500">Teacher Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <img
            src={avatar}
            alt={teacher.name}
            className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
          />
          <h2 className="text-xl font-bold text-slate-800 mt-4">{teacher.name}</h2>
          {teacher.email && (
            <div className="flex items-center justify-center gap-2 text-slate-500 mt-2">
              <Mail size={14} />
              <span className="text-sm">{teacher.email}</span>
            </div>
          )}
          <div className="mt-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              teacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {teacher.status || 'Active'}
            </span>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BookOpen size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Role</p>
                <p className="font-medium text-slate-800">{teacher.role}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-medium text-slate-800">{teacher.status}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <Calendar size={20} className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Added Date</p>
                <p className="font-medium text-slate-800">{teacher.created_at || 'N/A'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
