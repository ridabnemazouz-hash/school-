import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, FileText, Download, Link as LinkIcon, Video, Plus, FolderOpen, Calendar, Upload, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../config';

const typeIcons = {
  PDF: { icon: FileText, color: 'text-blue-600 bg-blue-50' },
  Video: { icon: Video, color: 'text-purple-600 bg-purple-50' },
  Link: { icon: LinkIcon, color: 'text-emerald-600 bg-emerald-50' },
  Document: { icon: FolderOpen, color: 'text-amber-600 bg-amber-50' },
};

export function Content() {
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', content_type: 'PDF', description: '', target_class: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const isTeacherOrAdmin = user.role === 'Teacher' || user.role === 'Admin' || user.role === 'Super Admin';

  useEffect(() => {
    fetchContents();
  }, [filter]);

  const fetchContents = async () => {
    try {
      const url = filter === 'All' ? `${API}/content/` : `${API}/content/?subject=${encodeURIComponent(filter)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setContents(data);
      }
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    if (e.target.files[0]) {
      const ext = e.target.files[0].name.split('.').pop().toLowerCase();
      const typeMap = { pdf: 'PDF', mp4: 'Video', mov: 'Video', avi: 'Video', doc: 'Document', docx: 'Document', txt: 'Document', xls: 'Document', xlsx: 'Document' };
      setForm(prev => ({ ...prev, content_type: typeMap[ext] || 'Document' }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject) return;
    setUploading(true);

    try {
            const formData = new FormData();
      formData.append('title', form.title);
      formData.append('subject', form.subject);
      formData.append('content_type', form.content_type);
      formData.append('description', form.description);
      formData.append('target_class', form.target_class);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(`${API}/content/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        setShowUpload(false);
        setForm({ title: '', subject: '', content_type: 'PDF', description: '', target_class: '' });
        setSelectedFile(null);
        fetchContents();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content?')) return;
    try {
            const res = await fetch(`${API}/content/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) fetchContents();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const subjects = ['All', ...new Set(contents.map(c => c.subject))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leçons & Devoirs</h1>
          <p className="text-slate-500 mt-1">Access lessons, assignments, and educational materials.</p>
        </div>
        {isTeacherOrAdmin && (
          <Button onClick={() => setShowUpload(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Upload size={18} className="mr-2" />
            Upload Content
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
              filter === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : contents.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600">No content yet</h3>
          <p className="text-sm text-slate-400 mt-1">Upload your first lesson or assignment.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map(item => {
            const typeInfo = typeIcons[item.content_type] || typeIcons.Document;
            const Icon = typeInfo.icon;
            return (
              <Card key={item.id} className="p-0 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all border-slate-100">
                <div className={`p-6 ${typeInfo.color} flex items-center justify-center relative`}>
                  <Icon size={48} className="transition-transform group-hover:scale-110 duration-300" />
                  <span className="absolute top-4 right-4 bg-white/80 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {item.content_type}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">{item.subject}</p>
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h3>
                  {item.description && <p className="text-xs text-slate-400 mb-4 line-clamp-2">{item.description}</p>}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">By</span>
                      <span className="text-xs font-semibold text-slate-600">{item.teacher_name}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Added on</span>
                      <span className="text-xs font-semibold text-slate-600">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {item.file_url && (
                      <Button variant="primary" className="flex-1 text-xs py-2 bg-indigo-600" onClick={() => window.open(`${API}${item.file_url}`, '_blank')}>
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    )}
                    {isTeacherOrAdmin && (
                      <Button variant="ghost" className="p-2 border border-slate-100 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <Card className="w-full max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Upload Content</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g. Chapter 5 - Linear Equations"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Target Class</label>
                  <input
                    type="text"
                    value={form.target_class}
                    onChange={e => setForm(prev => ({ ...prev, target_class: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g. 3ème année"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Brief description of the content..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">File</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => document.getElementById('fileInput').click()}>
                  <input id="fileInput" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.mp4,.mov,.avi,.txt,.png,.jpg" />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 font-semibold">
                      <FileText size={16} />
                      {selectedFile.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">Click to upload or drag & drop</p>
                      <p className="text-[10px] text-slate-300 mt-1">PDF, DOC, XLS, MP4, PNG (max 50MB)</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={() => setShowUpload(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
