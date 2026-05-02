import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, Trash2, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';

const LEVELS = [
  { id: 'primary', ar: 'ابتدائي', fr: 'Primaire', en: 'Primary', grades: ['1ère année','2ème année','3ème année','4ème année','5ème année','6ème année'], color: 'bg-emerald-100 text-emerald-700' },
  { id: 'middle', ar: 'إعدادي', fr: 'Collège', en: 'Middle School', grades: ['1ère année','2ème année','3ème année'], color: 'bg-blue-100 text-blue-700' },
  { id: 'high', ar: 'ثانوي', fr: 'Lycée', en: 'High School', grades: ['Tronc commun','1ère Bac','2ème Bac'], color: 'bg-purple-100 text-purple-700' },
];

function ActionMenu({ item, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
          <button onClick={() => { onDelete(item.id); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function Classes() {
  const { lang } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', level: 'primary', grade: '1ère année', teacher: '', capacity: 30 });

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = () => {
    setLoading(true);
    fetch('http://localhost:8000/classes/')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data);
        } else {
          console.error('Unexpected API response:', data);
          setClasses([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch classes:', err);
        setClasses([]);
      })
      .finally(() => setLoading(false));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/classes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          level: formData.level,
          grade: formData.grade,
          teacher: formData.teacher,
          capacity: Number(formData.capacity)
        })
      });
      if (!res.ok) throw new Error('Failed to add class');
      fetchClasses();
      setIsModalOpen(false);
      setFormData({ name: '', level: 'primary', grade: '1ère année', teacher: '', capacity: 30 });
      showSuccess(lang === 'fr' ? '✅ Classe ajoutée!' : '✅ Class added!');
    } catch (err) {
      showSuccess(lang === 'fr' ? '❌ Erreur lors de l\'ajout' : '❌ Failed to add');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:8000/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchClasses();
      setDeleteConfirm(null);
      showSuccess(lang === 'fr' ? '🗑️ Classe supprimée!' : '🗑️ Class removed!');
    } catch (err) {
      showSuccess(lang === 'fr' ? '❌ Erreur' : '❌ Failed');
    }
  };

  const handleLevelChange = (level) => {
    const levelObj = LEVELS.find(l => l.id === level);
    setFormData({ ...formData, level, grade: levelObj.grades[0] });
  };

  const getLevelInfo = (levelId) => LEVELS.find(l => l.id === levelId) || LEVELS[0];

  const filtered = classes.filter(c => {
    const name = c.name || '';
    const teacher = c.teacher || '';
    const level = c.level || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      teacher.toLowerCase().includes(search.toLowerCase()) ||
      level.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: classes.length,
    students: classes.reduce((a, c) => a + (c.students || 0), 0),
    capacity: classes.reduce((a, c) => a + (c.capacity || 0), 0),
    avg: classes.length ? Math.round(classes.reduce((a, c) => a + ((c.students || 0) / (c.capacity || 1)) * 100, 0) / classes.length) : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{lang === 'fr' ? 'Gestion des Classes' : 'Classes Management'}</h1>
          <p className="text-slate-500 mt-1">{lang === 'fr' ? 'Gérez les classes et les niveaux scolaires.' : 'Manage school classes and their assignments.'}</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> {lang === 'fr' ? 'Ajouter' : 'Add Class'}
        </Button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Classes' : 'Total Classes', value: stats.total, color: 'text-blue-700' },
          { label: lang === 'fr' ? 'Total Étudiants' : 'Total Students', value: stats.students, color: 'text-green-700' },
          { label: lang === 'fr' ? 'Capacité Totale' : 'Total Capacity', value: stats.capacity, color: 'text-purple-700' },
          { label: lang === 'fr' ? 'Occupation Moy.' : 'Avg. Occupancy', value: stats.avg + '%', color: 'text-orange-700' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder={lang === 'fr' ? 'Rechercher...' : 'Search classes...'} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
          </div>
          <span className="text-sm text-slate-400 ml-4">{filtered.length} {lang === 'fr' ? 'classe(s)' : 'class(es)'}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang === 'fr' ? 'Classe' : 'Class Name'}</TableHead>
              <TableHead>{lang === 'fr' ? 'Niveau' : 'Level'}</TableHead>
              <TableHead>{lang === 'fr' ? 'Prof Principal' : 'Head Teacher'}</TableHead>
              <TableHead>{lang === 'fr' ? 'Étudiants / Capacité' : 'Students / Capacity'}</TableHead>
              <TableHead>{lang === 'fr' ? 'Occupation' : 'Occupancy'}</TableHead>
              <TableHead className="text-right">{lang === 'fr' ? 'Actions' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">{lang === 'fr' ? 'Aucune classe trouvée.' : 'No classes found.'}</TableCell></TableRow>
            ) : filtered.map(cls => {
              const lvl = getLevelInfo(cls.level || 'primary');
              const pct = Math.round(((cls.students || 0) / (cls.capacity || 1)) * 100);
              const name = cls.name || '';
              const grade = cls.grade || '';
              const teacher = cls.teacher || '';
              const students = cls.students || 0;
              const capacity = cls.capacity || 0;
              return (
                <TableRow key={cls.id}>
                  <TableCell className="font-bold text-slate-800">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">{name} - {grade}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${lvl.color}`}>
                      {lvl[lang === 'fr' ? 'fr' : 'en']}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 flex items-center gap-2">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher)}&background=6366f1&color=fff&size=28`}
                      alt={teacher} className="w-7 h-7 rounded-full" />
                    {teacher}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Users size={14} /> {students} / {capacity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu item={cls} onDelete={(id) => setDeleteConfirm(id)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={lang === 'fr' ? 'Confirmer la suppression' : 'Confirm Delete'}>
        <div className="space-y-4">
          <p className="text-slate-600">{lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette classe?' : 'Are you sure you want to delete this class?'}</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{lang === 'fr' ? 'Annuler' : 'Cancel'}</Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white"><Trash2 size={16} className="mr-2" />{lang === 'fr' ? 'Supprimer' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={lang === 'fr' ? 'Ajouter une Classe' : 'Add New Class'}>
        <form onSubmit={handleAdd} className="space-y-4">
          {/* Level Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Niveau Scolaire' : 'School Level'}</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handleLevelChange(lvl.id)}
                  className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                    formData.level === lvl.id
                      ? 'border-mauve-500 bg-mauve-50 text-mauve-700 shadow-sm'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {lvl[lang === 'fr' ? 'fr' : 'en']}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'fr' ? 'Année / Filière' : 'Grade / Year'}</label>
            <select value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20">
              {getLevelInfo(formData.level).grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'fr' ? 'Nom de la Classe' : 'Class Name'}</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="e.g. 10-A" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'fr' ? 'Professeur Principal' : 'Head Teacher'}</label>
            <input type="text" required value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="Teacher name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'fr' ? 'Capacité' : 'Capacity'}</label>
            <input type="number" required min={1} max={50} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{lang === 'fr' ? 'Annuler' : 'Cancel'}</Button>
            <Button type="submit" className="flex-1">{lang === 'fr' ? 'Ajouter' : 'Add Class'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
