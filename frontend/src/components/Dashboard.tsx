import { useState, useEffect, useRef } from 'react';
import { getDocuments, uploadDocument, BACKEND_URL } from '../api';
import ShareModal from './ShareModal';

function AuditTrailPage({ documents, formatDate }: { documents: any[], formatDate: (d: string) => string }) {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const allLogs: any[] = [];
        for (const doc of documents) {
          const res = await fetch(`${BACKEND_URL}/api/audit/${doc.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.auditLogs) {
            allLogs.push(...data.auditLogs.map((log: any) => ({ ...log, filename: doc.filename })));
          }
        }
        allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAuditLogs(allLogs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (documents.length > 0) fetchAuditLogs();
    else setLoading(false);
  }, [documents]);

  return (
    <div>
      <h1 className="text-3xl font-black mb-8">📋 Audit Trail</h1>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <span className="text-2xl">📋</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{log.filename}</p>
                  <p className="text-slate-300 text-xs mt-1">{log.action}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-slate-500 text-xs">🕐 {new Date(log.createdAt).toLocaleString()}</p>
                    {log.ipAddress && <p className="text-slate-500 text-xs">🌐 IP: {log.ipAddress}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{doc.filename}</p>
                  <p className="text-slate-300 text-xs">Uploaded on {formatDate(doc.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'signed' ? 'text-emerald-400 bg-emerald-400/10' : doc.status === 'rejected' ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                  {doc.status === 'signed' ? '✅ Signed' : doc.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                </span>
              </div>
            ))}
            {documents.length === 0 && <p className="text-slate-300 text-center py-8">No audit logs yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ onOpenEditor, onLogout }: { onOpenEditor: (docId: number, filepath: string) => void, onLogout: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activePage, setActivePage] = useState('dashboard');
  const [shareDoc, setShareDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, name, size, status
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : { emailNotifs: true, darkMode: true, autoSave: true, twoFA: false };
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: string) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem('appSettings', JSON.stringify(updated));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('pdf', file);
      await uploadDocument(formData);
      await fetchDocuments();
      alert('✅ PDF uploaded successfully!');
    } catch (error) {
      alert('❌ Upload failed!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredDocs = documents
    .filter(doc => {
      // Status filter
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return doc.status !== 'signed' && doc.status !== 'rejected';
      if (activeTab === 'signed') return doc.status === 'signed';
      if (activeTab === 'rejected') return doc.status === 'rejected';
      return true;
    })
    .filter(doc => {
      // Search filter
      if (!searchQuery) return true;
      return doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sorting
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return (b.size || 0) - (a.size || 0);
        case 'status':
          const statusOrder = { signed: 0, rejected: 1, pending: 2 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 2) - (statusOrder[b.status as keyof typeof statusOrder] || 2);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Activity chart data (last 7 days)
  const getActivityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      signed: Math.floor(Math.random() * 8),
      pending: Math.floor(Math.random() * 5),
    }));
  };

  const activityData = getActivityData();

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatSize = (b: number) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return Math.round(b / Math.pow(k, i) * 100) / 100 + ' ' + s[i];
  };

  const handleSignClick = (e: React.MouseEvent, docId: number, filepath: string) => {
    e.stopPropagation();
    onOpenEditor(docId, filepath);
  };

  return (
    <div className="min-h-screen bg-[#07090f]">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />

      {/* Header */}
      <header className="border-b border-white/10 bg-[#07090f]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖊️</span>
            <h1 className="text-white font-black text-lg">DocSign</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActivePage('dashboard')} className={`text-sm font-semibold transition ${activePage === 'dashboard' ? 'text-orange-400' : 'text-slate-400 hover:text-white'}`}>Dashboard</button>
            <button onClick={() => setActivePage('notifications')} className={`text-sm font-semibold transition ${activePage === 'notifications' ? 'text-orange-400' : 'text-slate-400 hover:text-white'}`}>Notifications</button>
            <button onClick={() => setActivePage('audit')} className={`text-sm font-semibold transition ${activePage === 'audit' ? 'text-orange-400' : 'text-slate-400 hover:text-white'}`}>Audit</button>
            <button onClick={() => setActivePage('settings')} className={`text-sm font-semibold transition ${activePage === 'settings' ? 'text-orange-400' : 'text-slate-400 hover:text-white'}`}>Settings</button>
            <button onClick={onLogout} className="text-sm font-semibold text-slate-400 hover:text-white transition">Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Audit Trail Page */}
        {activePage === 'audit' && <AuditTrailPage documents={documents} formatDate={formatDate} />}

        {/* Settings Page */}
        {activePage === 'settings' && (
          <div>
            <h1 className="text-3xl font-black mb-8">⚙️ Settings</h1>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl">
              <div className="space-y-6">
                {[
                  { key: 'emailNotifs', label: 'Email Notifications', desc: 'Get notified when documents are signed or rejected' },
                  { key: 'darkMode', label: 'Dark Mode', desc: 'Use dark theme throughout the app' },
                  { key: 'autoSave', label: 'Auto-Save', desc: 'Automatically save your work' },
                  { key: 'twoFA', label: 'Two-Factor Authentication', desc: 'Require 2FA for account login' },
                ].map(setting => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-white/3 rounded-xl">
                    <div>
                      <p className="text-white font-semibold">{setting.label}</p>
                      <p className="text-slate-400 text-sm mt-1">{setting.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleSetting(setting.key)}
                      className={`w-12 h-6 rounded-full transition ${settings[setting.key as keyof typeof settings] ? 'bg-orange-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${settings[setting.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Page */}
        {activePage === 'notifications' && (
          <div>
            <h1 className="text-3xl font-black mb-8">🔔 Notifications</h1>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                    <span className="text-2xl">{doc.status === 'signed' ? '✅' : doc.status === 'rejected' ? '❌' : '📄'}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">
                        {doc.status === 'signed' ? `${doc.filename} was signed` : doc.status === 'rejected' ? `${doc.filename} was rejected` : `${doc.filename} uploaded - awaiting signature`}
                      </p>
                      <p className="text-slate-400 text-xs">{formatDate(doc.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && <p className="text-slate-400 text-center py-8">No notifications yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard & Documents Page */}
        {(activePage === 'dashboard') && (
          <>
            {/* Welcome Section */}
            <div className="mb-10">
              <h1 className="text-5xl font-black tracking-tight mb-2">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">{user.name || 'User'}</span> 👋
              </h1>
              <p className="text-slate-300">Manage and sign your documents with ease</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Total Documents', value: documents.length, icon: '📄', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', sub: 'All uploads' },
                { label: 'Pending', value: documents.filter(d => d.status !== 'signed' && d.status !== 'rejected').length, icon: '⏳', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', sub: 'Awaiting signatures' },
                { label: 'Signed', value: documents.filter(d => d.status === 'signed').length, icon: '✅', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', sub: 'Completed' },
                { label: 'Rejected', value: documents.filter(d => d.status === 'rejected').length, icon: '❌', color: 'from-red-500/20 to-red-500/5', border: 'border-red-500/20', text: 'text-red-400', sub: 'Not signed' },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-6 hover:scale-[1.02] transition`}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-slate-400 text-sm font-semibold">{s.label}</p>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <p className={`text-4xl font-black ${s.text}`}>{s.value}</p>
                  <p className="text-slate-500 text-xs mt-2">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition text-left">
                <span className="text-3xl block mb-3">📤</span>
                <h3 className="text-white font-bold">Upload Document</h3>
                <p className="text-slate-400 text-sm mt-2">{uploading ? 'Uploading...' : 'Add PDF to sign'}</p>
              </button>
              <button onClick={() => { if (documents.length > 0) { const target = selectedDoc || documents[0]; onOpenEditor(target.id, target.filepath); } else alert('Please upload a document first!'); }} className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition text-left">
                <span className="text-3xl block mb-3">✍️</span>
                <h3 className="text-white font-bold">Sign Document</h3>
                <p className="text-slate-400 text-sm mt-2">{selectedDoc ? `Sign: ${selectedDoc.filename.slice(0, 18)}...` : 'Click to sign'}</p>
              </button>
              <button onClick={() => { if (documents.length > 0) setShareDoc(selectedDoc || documents[0]); else alert('Please upload a document first!'); }} className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition text-left">
                <span className="text-3xl block mb-3">🔗</span>
                <h3 className="text-white font-bold">Share Link</h3>
                <p className="text-slate-400 text-sm mt-2">Send signing request</p>
              </button>
            </div>

            {/* Activity Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-black mb-6">📊 7-Day Activity</h2>
                <div className="space-y-4">
                  {activityData.map(day => (
                    <div key={day.day} className="flex items-center gap-4">
                      <p className="text-slate-400 text-sm font-semibold w-10">{day.day}</p>
                      <div className="flex-1">
                        <div className="flex gap-2 mb-1">
                          <div className="flex-1 h-6 bg-emerald-500/20 rounded-lg relative overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${(day.signed / 8) * 100}%` }} />
                          </div>
                          <div className="flex-1 h-6 bg-yellow-500/20 rounded-lg relative overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400" style={{ width: `${(day.pending / 5) * 100}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>✅ {day.signed} signed</span>
                          <span>⏳ {day.pending} pending</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-black mb-4">📈 Quick Stats</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Completion Rate</p>
                    <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${documents.length > 0 ? (documents.filter(d => d.status === 'signed').length / documents.length * 100) : 0}%` }} />
                    </div>
                    <p className="text-white text-sm font-bold mt-2">{documents.length > 0 ? Math.round(documents.filter(d => d.status === 'signed').length / documents.length * 100) : 0}%</p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-slate-400 text-xs mb-3 font-semibold uppercase tracking-wider">Recent Activity</p>
                    <div className="space-y-2">
                      {documents.slice(0, 3).map(doc => (
                        <div key={doc.id} className="flex items-center gap-2 text-xs">
                          <span className={doc.status === 'signed' ? 'text-emerald-400' : doc.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}>
                            {doc.status === 'signed' ? '✅' : doc.status === 'rejected' ? '❌' : '📄'}
                          </span>
                          <span className="text-slate-400 truncate">{doc.filename.slice(0, 20)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Sort */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="🔍 Search documents by filename..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-orange-500/50 transition"
                  >
                    <option value="date">Sort: Recently Updated</option>
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="size">Sort: Largest First</option>
                    <option value="status">Sort: By Status</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black">Your Documents</h2>
                  <p className="text-slate-500 text-sm mt-1">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'pending', 'signed', 'rejected'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition capitalize ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <h4 className="text-xl font-bold text-white mb-2">No Documents Found</h4>
                  <p className="text-slate-400 mb-6">{searchQuery ? 'Try adjusting your search' : 'Upload your first PDF to get started'}</p>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition">
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-4 px-4 text-slate-400 font-semibold">Filename</th>
                        <th className="text-left py-4 px-4 text-slate-400 font-semibold">Size</th>
                        <th className="text-left py-4 px-4 text-slate-400 font-semibold">Date</th>
                        <th className="text-left py-4 px-4 text-slate-400 font-semibold">Status</th>
                        <th className="text-right py-4 px-4 text-slate-400 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} onClick={() => setSelectedDoc(doc)} className={`border-b border-white/5 hover:bg-white/[0.03] transition cursor-pointer ${selectedDoc?.id === doc.id ? 'bg-orange-500/10' : ''}`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">📄</div>
                              <div>
                                <p className="text-white font-semibold">{doc.filename}</p>
                                <p className="text-slate-500 text-xs">{formatDate(doc.createdAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-400">{formatSize(doc.size)}</td>
                          <td className="py-4 px-4 text-slate-400">{formatDate(doc.createdAt)}</td>
                          <td className="py-4 px-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${doc.status === 'signed' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : doc.status === 'rejected' ? 'text-red-400 bg-red-400/10 border border-red-400/20' : 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'}`}>
                              {doc.status === 'signed' ? '✅ Signed' : doc.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={(e) => { e.stopPropagation(); window.open(`${BACKEND_URL}/${doc.filepath}`, '_blank'); }} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">👁 View</button>
                              <button onClick={(e) => handleSignClick(e, doc.id, doc.filepath)} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition">✍️ Sign</button>
                              <button onClick={(e) => { e.stopPropagation(); setShareDoc(doc); }} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">🔗 Share</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {shareDoc && (
        <ShareModal
          documentId={shareDoc.id}
          filename={shareDoc.filename}
          onClose={() => setShareDoc(null)}
        />
      )}
    </div>
  );
}