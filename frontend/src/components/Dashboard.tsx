import { useState, useEffect, useRef } from 'react';
import { getDocuments, uploadDocument, BACKEND_URL } from '../api';
import ShareModal from './ShareModal';

function AuditTrailPage({ documents }: { documents: any[] }) {
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
      <h1 className="text-4xl font-black mb-2">📋 Audit Trail</h1>
      <p className="text-slate-400 mb-8">Complete history of all document actions</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-4">
            {auditLogs.map((log, i) => (
              <div key={log.id} className={`flex items-start gap-4 p-5 rounded-xl border ${i === 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/3 border-white/10'}`}>
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-lg">📝</div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{log.filename}</p>
                  <p className="text-slate-300 text-xs mt-1">{log.action}</p>
                  <div className="flex gap-4 mt-3 text-xs">
                    <span className="text-slate-500">🕐 {new Date(log.createdAt).toLocaleString()}</span>
                    {log.ipAddress && <span className="text-slate-500">🌐 {log.ipAddress}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400">No audit logs yet. Start signing documents!</p>
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
  const [sortBy, setSortBy] = useState('date');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return doc.status !== 'signed' && doc.status !== 'rejected';
      if (activeTab === 'signed') return doc.status === 'signed';
      if (activeTab === 'rejected') return doc.status === 'rejected';
      return true;
    })
    .filter(doc => {
      if (!searchQuery) return true;
      return doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
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

  const stats = [
    { label: 'Total Documents', value: documents.length, icon: '📄', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', trend: '+12%', change: 'up' },
    { label: 'Pending Signatures', value: documents.filter(d => d.status !== 'signed' && d.status !== 'rejected').length, icon: '⏳', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', trend: '-5%', change: 'down' },
    { label: 'Fully Signed', value: documents.filter(d => d.status === 'signed').length, icon: '✅', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', trend: '+8%', change: 'up' },
    { label: 'Rejected Documents', value: documents.filter(d => d.status === 'rejected').length, icon: '❌', color: 'from-red-500/20 to-red-500/5', border: 'border-red-500/20', text: 'text-red-400', trend: '+2%', change: 'up' },
  ];

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

  const activityChartData = [
    { day: 'Mon', signed: 4, pending: 2, rejected: 1 },
    { day: 'Tue', signed: 3, pending: 4, rejected: 0 },
    { day: 'Wed', signed: 5, pending: 1, rejected: 1 },
    { day: 'Thu', signed: 2, pending: 3, rejected: 2 },
    { day: 'Fri', signed: 6, pending: 2, rejected: 0 },
    { day: 'Sat', signed: 1, pending: 1, rejected: 1 },
    { day: 'Sun', signed: 3, pending: 2, rejected: 0 },
  ];

  const completionRate = documents.length > 0 
    ? Math.round((documents.filter(d => d.status === 'signed').length / documents.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07090f] to-[#0a0d14]">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />

      {/* Header */}
      <header className="border-b border-white/10 bg-[#07090f]/95 backdrop-blur sticky top-0 z-40">
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:text-orange-400 transition lg:hidden">
              {sidebarOpen ? '✕' : '☰'}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-lg">🖊️</div>
              <h1 className="text-white font-black text-xl">DocSign Pro</h1>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition flex items-center gap-2">
              <span>📤</span>
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
            <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center cursor-pointer hover:bg-orange-500/30 transition">
              <span className="text-lg">{user.name?.[0] || 'U'}</span>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-white transition text-sm font-semibold">Logout</button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-white/10 bg-[#07090f]/50 backdrop-blur p-8 hidden lg:block sticky top-24 h-[calc(100vh-96px)]">
            <nav className="space-y-3">
              {[
                { id: 'dashboard', icon: '📊', label: 'Dashboard', count: null },
                { id: 'documents', icon: '📄', label: 'My Documents', count: documents.length },
                { id: 'pending', icon: '⏳', label: 'Pending', count: documents.filter(d => d.status !== 'signed' && d.status !== 'rejected').length },
                { id: 'signed', icon: '✅', label: 'Signed', count: documents.filter(d => d.status === 'signed').length },
                { id: 'audit', icon: '📋', label: 'Audit Trail', count: null },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => activePage === 'dashboard' ? setActiveTab(item.id === 'documents' ? 'all' : item.id) : setActivePage(item.id === 'audit' ? 'audit' : 'dashboard')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                    activePage === item.id || activeTab === item.id
                      ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  {item.count !== null && <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{item.count}</span>}
                </button>
              ))}
            </nav>

            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
                <p className="text-white font-black text-sm mb-3">Ready to upgrade?</p>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">Unlock advanced features and priority support</p>
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold text-xs hover:opacity-90 transition">
                  Upgrade Now
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 px-8 py-12">
          {activePage === 'audit' && <AuditTrailPage documents={documents} />}

          {activePage === 'dashboard' && (
            <>
              {/* Welcome Hero */}
              <div className="mb-12">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">{user.name || 'User'}</span>
                </h1>
                <p className="text-slate-400 text-lg">You have <span className="text-orange-400 font-bold">{documents.filter(d => d.status !== 'signed' && d.status !== 'rejected').length} documents</span> awaiting signatures</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-7 group hover:scale-[1.02] transition cursor-pointer`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-slate-400 text-sm font-semibold">{stat.label}</p>
                        <p className={`text-4xl font-black mt-1 ${stat.text}`}>{stat.value}</p>
                      </div>
                      <span className="text-3xl group-hover:scale-125 transition">{stat.icon}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${stat.change === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span>{stat.change === 'up' ? '📈' : '📉'}</span>
                      <span>{stat.trend} from last week</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts & Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Activity Chart */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8">
                  <h2 className="text-2xl font-black mb-8">📊 Weekly Activity</h2>
                  <div className="space-y-5">
                    {activityChartData.map(day => (
                      <div key={day.day} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-slate-400 font-semibold text-sm">{day.day}</p>
                          <p className="text-slate-500 text-xs">{day.signed + day.pending + day.rejected} actions</p>
                        </div>
                        <div className="flex gap-2 h-8">
                          <div className="flex-1 bg-emerald-500/20 rounded-lg relative overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg" style={{ width: `${(day.signed / 8) * 100}%` }} />
                            {day.signed > 0 && <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">{day.signed}</span>}
                          </div>
                          <div className="flex-1 bg-yellow-500/20 rounded-lg relative overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg" style={{ width: `${(day.pending / 5) * 100}%` }} />
                            {day.pending > 0 && <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">{day.pending}</span>}
                          </div>
                          <div className="flex-1 bg-red-500/20 rounded-lg relative overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-lg" style={{ width: `${(day.rejected / 3) * 100}%` }} />
                            {day.rejected > 0 && <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">{day.rejected}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-6 mt-8 pt-8 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-slate-400">Signed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-slate-400">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-slate-400">Rejected</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats & Completion */}
                <div className="space-y-6">
                  {/* Completion Card */}
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
                    <h3 className="text-white font-black mb-6">🎯 Completion Rate</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                          <circle
                            cx="50" cy="50" r="45" fill="none"
                            stroke="url(#gradient)" strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 45 * (completionRate / 100)} ${2 * Math.PI * 45}`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-black text-orange-400">{completionRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-2">Documents completed</p>
                        <p className="text-white text-sm font-semibold">{documents.filter(d => d.status === 'signed').length} of {documents.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Documents */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-black mb-4">📌 Recent</h3>
                    <div className="space-y-3">
                      {documents.slice(0, 3).map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-sm">📄</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{doc.filename.slice(0, 20)}</p>
                            <p className="text-slate-500 text-[10px]">{formatSize(doc.size)}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                            doc.status === 'signed' ? 'bg-emerald-400/20 text-emerald-400' :
                            doc.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                            'bg-yellow-400/20 text-yellow-400'
                          }`}>
                            {doc.status === 'signed' ? '✅' : doc.status === 'rejected' ? '❌' : '⏳'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <button onClick={() => fileInputRef.current?.click()} className="group bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 rounded-2xl p-8 hover:scale-[1.02] transition text-left">
                  <span className="text-4xl block mb-4 group-hover:scale-125 transition">📤</span>
                  <h3 className="text-white font-black mb-2">Upload Document</h3>
                  <p className="text-slate-400 text-sm">Add PDF files to sign</p>
                </button>
                <button onClick={() => { if (documents.length > 0) { const target = selectedDoc || documents[0]; onOpenEditor(target.id, target.filepath); } else alert('Please upload a document first!'); }} className="group bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8 hover:scale-[1.02] transition text-left">
                  <span className="text-4xl block mb-4 group-hover:scale-125 transition">✍️</span>
                  <h3 className="text-white font-black mb-2">Sign Document</h3>
                  <p className="text-slate-400 text-sm">Add your signature</p>
                </button>
                <button onClick={() => { if (documents.length > 0) setShareDoc(selectedDoc || documents[0]); else alert('Please upload a document first!'); }} className="group bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 hover:scale-[1.02] transition text-left">
                  <span className="text-4xl block mb-4 group-hover:scale-125 transition">🔗</span>
                  <h3 className="text-white font-black mb-2">Share Link</h3>
                  <p className="text-slate-400 text-sm">Request signatures</p>
                </button>
              </div>

              {/* Documents Table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-black">📑 All Documents</h2>
                    <p className="text-slate-400 mt-2">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} found</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'signed', 'rejected'].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition capitalize ${activeTab === tab ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 flex gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-orange-500/50 transition"
                  >
                    <option value="date">Sort: Recently Updated</option>
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="size">Sort: Largest First</option>
                    <option value="status">Sort: By Status</option>
                  </select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📭</div>
                    <h4 className="text-2xl font-black text-white mb-3">No Documents Found</h4>
                    <p className="text-slate-400 mb-8 text-lg">{searchQuery ? 'Try adjusting your search' : 'Upload your first PDF to get started'}</p>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-3.5 rounded-xl font-bold hover:opacity-90 transition">
                      Upload Document
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-4 px-4 text-slate-400 font-bold text-sm">Document</th>
                          <th className="text-left py-4 px-4 text-slate-400 font-bold text-sm hidden md:table-cell">Size</th>
                          <th className="text-left py-4 px-4 text-slate-400 font-bold text-sm">Status</th>
                          <th className="text-left py-4 px-4 text-slate-400 font-bold text-sm">Date</th>
                          <th className="text-right py-4 px-4 text-slate-400 font-bold text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocs.map((doc, i) => (
                          <tr key={doc.id} onClick={() => setSelectedDoc(doc)} className={`border-b border-white/5 hover:bg-white/[0.03] transition cursor-pointer ${selectedDoc?.id === doc.id ? 'bg-orange-500/10' : ''} ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center font-bold">📄</div>
                                <div>
                                  <p className="text-white font-bold text-sm">{doc.filename.slice(0, 30)}</p>
                                  <p className="text-slate-500 text-xs">{formatDate(doc.createdAt)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-400 text-sm hidden md:table-cell">{formatSize(doc.size)}</td>
                            <td className="py-4 px-4">
                              <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${doc.status === 'signed' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : doc.status === 'rejected' ? 'text-red-400 bg-red-400/10 border border-red-400/20' : 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'}`}>
                                {doc.status === 'signed' ? '✅ Signed' : doc.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-400 text-sm">{formatDate(doc.createdAt)}</td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); window.open(`${BACKEND_URL}/${doc.filepath}`, '_blank'); }} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">👁</button>
                                <button onClick={(e) => handleSignClick(e, doc.id, doc.filepath)} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition">✍️</button>
                                <button onClick={(e) => { e.stopPropagation(); setShareDoc(doc); }} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">🔗</button>
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
      </div>

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