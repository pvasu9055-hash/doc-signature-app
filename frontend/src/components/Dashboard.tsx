import { useState, useEffect, useRef } from 'react';
import { getDocuments, uploadDocument, BACKEND_URL } from '../api';
import ShareModal from './ShareModal';
import Enable2FA from './Enable2FA';

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
                  <p className="text-slate-400 text-xs">Uploaded on {formatDate(doc.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'signed' ? 'text-emerald-400 bg-emerald-400/10' : doc.status === 'rejected' ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                  {doc.status === 'signed' ? '✅ Signed' : doc.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                </span>
              </div>
            ))}
            {documents.length === 0 && <p className="text-slate-400 text-center py-8">No audit logs yet</p>}
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
    if (key === 'twoFA') {
      // When 2FA toggle is clicked, show the Enable2FA page
      setActivePage('enable-2fa');
      return;
    }
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

  const filteredDocs = documents.filter(doc => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return doc.status !== 'signed' && doc.status !== 'rejected';
    if (activeTab === 'signed') return doc.status === 'signed';
    if (activeTab === 'rejected') return doc.status === 'rejected';
    return true;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatSize = (b: number) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
  };

  const handleSignClick = (e: React.MouseEvent, docId: number, filepath: string) => {
    e.stopPropagation();
    onOpenEditor(docId, filepath);
  };

  const sidebarMenu = [
    { icon: '📊', label: 'Dashboard', key: 'dashboard' },
    { icon: '📄', label: 'My Documents', key: 'documents' },
    { icon: '✍️', label: 'Sign Document', key: 'sign' },
    { icon: '📋', label: 'Audit Trail', key: 'audit' },
    { icon: '🔗', label: 'Shared Links', key: 'shared' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-3 bg-black/70 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🖊️</span>
          <span className="font-black text-lg tracking-tight">DocSign</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="text" placeholder="🔍 Search documents..." className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56 transition" />
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-orange-500/20 disabled:opacity-50">
            {uploading ? '⏳ Uploading...' : '+ Upload PDF'}
          </button>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-slate-300">{user.name || 'User'}</span>
          </div>
          <button onClick={onLogout} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-sm hover:bg-red-500/20 transition">Logout</button>
        </div>
      </nav>

      <div className="pt-20 flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 h-full w-56 bg-black/40 border-r border-white/10 p-4 pt-6">
          <p className="text-slate-500 text-xs font-semibold uppercase mb-3">Menu</p>
          {sidebarMenu.map((item) => (
            <div key={item.key} onClick={() => {
              setActivePage(item.key);
              if (item.key === 'sign') {
                if (documents.length > 0) onOpenEditor(documents[0].id, documents[0].filepath);
                else alert('Please upload a document first!');
              }
              if (item.key === 'documents') setActiveTab('all');
            }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition ${activePage === item.key ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}

          <p className="text-slate-500 text-xs font-semibold uppercase mb-3 mt-6">Account</p>
          {[
            { icon: '👤', label: 'Profile', key: 'profile' },
            { icon: '⚙️', label: 'Settings', key: 'settings' },
            { icon: '🔔', label: 'Notifications', key: 'notifications' },
          ].map((item) => (
            <div key={item.key} onClick={() => setActivePage(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition ${activePage === item.key ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}

          <div className="absolute bottom-20 left-4 right-4 bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-sm font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white text-xs font-bold">{user.name || 'User'}</p>
                <p className="text-slate-400 text-xs">{user.email || ''}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1 text-center">
              <p className="text-orange-400 text-xs font-semibold">Free Plan</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-56 flex-1 p-8">

          {/* Enable 2FA Page */}
          {activePage === 'enable-2fa' && (
            <Enable2FA 
              userId={user.id}
              onSetupComplete={() => {
                setActivePage('verify-2fa-setup');
              }}
              onBack={() => setActivePage('settings')}
            />
          )}

          {/* Profile Page */}
          {activePage === 'profile' && (
            <div className="max-w-lg">
              <h1 className="text-3xl font-black mb-8">👤 Profile</h1>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-2xl font-black">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{user.name}</h2>
                    <p className="text-slate-400">{user.email}</p>
                    <span className="text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded-full">Free Plan</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-xl p-4"><p className="text-slate-400 text-xs">Full Name</p><p className="text-white font-semibold">{user.name}</p></div>
                  <div className="bg-white/5 rounded-xl p-4"><p className="text-slate-400 text-xs">Email</p><p className="text-white font-semibold">{user.email}</p></div>
                  <div className="bg-white/5 rounded-xl p-4"><p className="text-slate-400 text-xs">Documents</p><p className="text-white font-semibold">{documents.length} uploaded</p></div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Page */}
          {activePage === 'settings' && (
            <div className="max-w-lg">
              <h1 className="text-3xl font-black mb-8">⚙️ Settings</h1>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                {[
                  { key: 'emailNotifs', label: 'Email Notifications' },
                  { key: 'darkMode', label: 'Dark Mode' },
                  { key: 'autoSave', label: 'Auto-save Signatures' },
                  { key: 'twoFA', label: 'Two-Factor Auth (Click to Setup)' }
                ].map((s) => (
                  <div key={s.key} onClick={() => toggleSetting(s.key)} className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition cursor-pointer">
                    <span className="text-white text-sm font-medium">{s.label}</span>
                    <div className={`w-10 h-5 rounded-full transition ${settings[s.key as keyof typeof settings] ? 'bg-orange-500' : 'bg-slate-600'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail Page */}
          {activePage === 'audit' && (
            <AuditTrailPage documents={documents} formatDate={formatDate} />
          )}

          {/* Shared Links Page */}
          {activePage === 'shared' && (
            <div>
              <h1 className="text-3xl font-black mb-8">🔗 Shared Links</h1>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="space-y-3">
                  {JSON.parse(localStorage.getItem('sharedLinks') || '[]').map((item: any) => (
                    <div key={item.id} className="border border-white/10 rounded-xl p-4 bg-white/3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white text-sm">{item.filename}</h4>
                        <span className="text-slate-500 text-xs">{formatDate(item.sentAt)}</span>
                      </div>
                      <p className="text-slate-400 text-xs mb-2">
                        Sent to <span className="text-orange-400">{item.signerName || 'Signer'}</span> ({item.signerEmail})
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-blue-400 text-xs break-all flex-1 bg-white/5 rounded-lg px-3 py-2">{item.link}</p>
                        <button onClick={() => { navigator.clipboard.writeText(item.link); alert('🔗 Link copied!'); }} className="bg-white/10 text-white px-3 py-2 rounded-lg text-xs hover:bg-white/20 transition whitespace-nowrap">📋 Copy</button>
                      </div>
                    </div>
                  ))}
                  {JSON.parse(localStorage.getItem('sharedLinks') || '[]').length === 0 && (
                    <p className="text-slate-400 text-center py-8">No shared links yet. Share a document to get started!</p>
                  )}
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
                    <div key={doc.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
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
          {(activePage === 'dashboard' || activePage === 'documents') && (
            <>
              <div className="mb-8">
                <h1 className="text-4xl font-black tracking-tight mb-1">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">{user.name || 'User'}</span> 👋
                </h1>
                <p className="text-slate-400">Here's what's happening with your documents today</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Documents', value: documents.length, icon: '📄', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', sub: 'All uploads' },
                  { label: 'Pending', value: documents.filter(d => d.status !== 'signed' && d.status !== 'rejected').length, icon: '⏳', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', sub: 'Need signatures' },
                  { label: 'Completed', value: documents.filter(d => d.status === 'signed').length, icon: '✅', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', sub: 'Fully signed' },
                  { label: 'Rejected', value: documents.filter(d => d.status === 'rejected').length, icon: '❌', color: 'from-red-500/20 to-red-500/5', border: 'border-red-500/20', text: 'text-red-400', sub: 'Rejected docs' },
                ].map((s) => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5 hover:scale-[1.02] transition cursor-pointer`}>
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-slate-400 text-sm">{s.label}</p>
                      <span className="text-xl">{s.icon}</span>
                    </div>
                    <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
                    <p className="text-slate-500 text-xs mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition">
                  <span className="text-3xl">📤</span>
                  <h3 className="text-white font-bold mt-3">Upload Document</h3>
                  <p className="text-slate-400 text-sm mt-1">Add a new PDF to sign</p>
                </div>
                <div onClick={() => { if (documents.length > 0) { const target = selectedDoc || documents[0]; onOpenEditor(target.id, target.filepath); } else alert('Please upload a document first!'); }}
                  className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition">
                  <span className="text-3xl">✍️</span>
                  <h3 className="text-white font-bold mt-3">Sign Document</h3>
                  <p className="text-slate-400 text-sm mt-1">{selectedDoc ? `Sign: ${selectedDoc.filename.slice(0, 20)}...` : 'Click to sign latest doc'}</p>
                </div>
                <div onClick={() => { if (documents.length > 0) setShareDoc(selectedDoc || documents[0]); else alert('Please upload a document first!'); }}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition">
                  <span className="text-3xl">🔗</span>
                  <h3 className="text-white font-bold mt-3">Share Link</h3>
                  <p className="text-slate-400 text-sm mt-1">Send signing request</p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-black">Your Documents</h2>
                    <p className="text-slate-500 text-sm">{documents.length} total</p>
                  </div>
                  <div className="flex gap-2">
                    {['all', 'pending', 'signed', 'rejected'].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-xl text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
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
                    <div className="text-5xl mb-4">📭</div>
                    <h4 className="text-xl font-bold text-white mb-2">No Documents Yet</h4>
                    <p className="text-slate-400 mb-6">Upload your first PDF to get started</p>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition">
                      Upload Your First Document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocs.map((doc) => (
                      <div key={doc.id} onClick={() => setSelectedDoc(doc)}
                        className={`border rounded-xl p-4 cursor-pointer transition ${selectedDoc?.id === doc.id ? 'bg-orange-500/10 border-orange-500/40' : 'bg-white/3 border-white/10 hover:border-white/20'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-xl">📄</div>
                            <div>
                              <h4 className="font-semibold text-white text-sm">{doc.filename}</h4>
                              <div className="flex gap-3 mt-0.5 text-xs text-slate-400">
                                <span>{formatSize(doc.size)}</span>
                                <span>•</span>
                                <span>{formatDate(doc.createdAt)}</span>
                                <span>•</span>
                                <span className={doc.status === 'signed' ? 'text-emerald-400' : doc.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}>
                                  {doc.status === 'signed' ? '✅ Signed' : doc.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); window.open(`${BACKEND_URL}/${doc.filepath}`, '_blank'); }} className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 transition">👁 View</button>
                            <button onClick={(e) => handleSignClick(e, doc.id, doc.filepath)} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition">✍️ Sign</button>
                            <button onClick={(e) => { e.stopPropagation(); setShareDoc(doc); }} className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 transition">🔗 Share</button>
                            <button onClick={(e) => { e.stopPropagation(); window.open(`${BACKEND_URL}/${doc.signedFilepath || doc.filepath}`, '_blank'); }} className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 transition">⬇️ {doc.signedFilepath ? '📄 Signed PDF' : 'Download'}</button>
                          </div>
                        </div>
                      </div>
                    ))}
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