import { useState, useEffect } from 'react';
import { getDocuments } from '../api';

export default function Dashboard({ onOpenEditor, onLogout }: { onOpenEditor: () => void, onLogout: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatSize = (b: number) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-3 bg-black/70 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🖊️</span>
          <span className="font-black text-lg tracking-tight">DocSign</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Search documents..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56 transition"
          />
          <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-orange-500/20">
            + Upload PDF
          </button>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-slate-300">{user.name || 'User'}</span>
          </div>
          <button onClick={onLogout} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-sm hover:bg-red-500/20 transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="pt-20 flex">

        {/* Sidebar */}
        <aside className="fixed left-0 top-14 h-full w-56 bg-black/40 border-r border-white/10 p-4 pt-6">
          <p className="text-slate-500 text-xs font-semibold uppercase mb-3">Menu</p>
          {[
            { icon: '📊', label: 'Dashboard', active: true },
            { icon: '📄', label: 'My Documents', active: false },
            { icon: '✍️', label: 'Sign Document', active: false },
            { icon: '📋', label: 'Audit Trail', active: false },
            { icon: '🔗', label: 'Shared Links', active: false },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition ${item.active ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}

          <p className="text-slate-500 text-xs font-semibold uppercase mb-3 mt-6">Account</p>
          {[
            { icon: '👤', label: 'Profile' },
            { icon: '⚙️', label: 'Settings' },
            { icon: '🔔', label: 'Notifications' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer text-slate-400 hover:bg-white/5 hover:text-white transition">
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}

          {/* User Card */}
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

          {/* Header */}
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
              { label: 'Pending', value: 0, icon: '⏳', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', sub: 'Need signatures' },
              { label: 'Completed', value: 0, icon: '✅', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', sub: 'Fully signed' },
              { label: 'This Month', value: 0, icon: '📅', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', sub: 'New uploads' },
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
            {[
              { icon: '📤', title: 'Upload Document', desc: 'Add a new PDF to sign', color: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/20' },
              { icon: '✍️', title: 'Sign Document', desc: 'Place your signature', color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', action: onOpenEditor },
              { icon: '🔗', title: 'Share Link', desc: 'Send signing request', color: 'from-purple-500/20 to-pink-500/10', border: 'border-purple-500/20' },
            ].map((a) => (
              <div
                key={a.title}
                onClick={a.action}
                className={`bg-gradient-to-br ${a.color} border ${a.border} rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition`}>
                <span className="text-3xl">{a.icon}</span>
                <h3 className="text-white font-bold mt-3">{a.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Documents Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black">Your Documents</h2>
                <p className="text-slate-500 text-sm">{documents.length} total</p>
              </div>
              <div className="flex gap-2">
                {['all', 'pending', 'signed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
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
            ) : documents.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <h4 className="text-xl font-bold text-white mb-2">No Documents Yet</h4>
                <p className="text-slate-400 mb-6">Upload your first PDF to get started</p>
                <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition">
                  Upload Your First Document
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
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
                            <span className="text-yellow-400">⏳ Pending</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 transition">👁 View</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenEditor(); }}
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition">
                          ✍️ Sign
                        </button>
                        <button className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 transition">🔗 Share</button>
                        <button className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 transition">⬇️ Download</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}