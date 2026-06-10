import { useState, useEffect } from 'react';
import { getDocuments } from '../api';

export default function Dashboard({ onOpenEditor }: { onOpenEditor: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              D
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">DocSign</h1>
              <p className="text-xs text-slate-500 font-medium">Digital Signatures</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
              <span className="absolute left-3 top-3 text-slate-400">🔍</span>
            </div>
            <button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition transform hover:scale-105">
              + Upload
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-md transition">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-5xl font-black text-slate-900 mb-3">My Documents</h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Manage, organize, and securely sign all your documents in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
            <p className="text-slate-600 text-sm font-medium mb-2">Total Documents</p>
            <p className="text-4xl font-black text-slate-900">{documents.length}</p>
            <p className="text-xs text-slate-500 mt-2">All uploads</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
            <p className="text-slate-600 text-sm font-medium mb-2">Pending</p>
            <p className="text-4xl font-black text-orange-600">0</p>
            <p className="text-xs text-slate-500 mt-2">Need signatures</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
            <p className="text-slate-600 text-sm font-medium mb-2">Completed</p>
            <p className="text-4xl font-black text-emerald-600">0</p>
            <p className="text-xs text-slate-500 mt-2">Fully signed</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
            <p className="text-slate-600 text-sm font-medium mb-2">This Month</p>
            <p className="text-4xl font-black text-blue-600">0</p>
            <p className="text-xs text-slate-500 mt-2">New uploads</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center mb-12 hover:border-orange-500 hover:bg-orange-50/30 transition group">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-6 group-hover:scale-110 transition">
            <span className="text-4xl">📤</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload Documents</h3>
          <p className="text-slate-600 mb-8 max-w-sm mx-auto">
            Drag and drop your PDF files here, or click the button below.
          </p>
          <button className="px-10 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition transform hover:scale-105">
            Select Files to Upload
          </button>
          <p className="text-xs text-slate-500 mt-6">Supported formats: PDF • Max file size: 100MB</p>
        </div>

        {/* Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-slate-900">Your Documents</h3>
              <p className="text-slate-600 text-sm mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''} in your library
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition">Sort</button>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition">Filter</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Loading your documents...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-20 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-full mb-6">
                <span className="text-5xl">📄</span>
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">No Documents Yet</h4>
              <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                Start by uploading your first PDF document.
              </p>
              <button className="px-10 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition transform hover:scale-105">
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`bg-white border-2 rounded-xl p-6 cursor-pointer transition transform ${
                    selectedDoc?.id === doc.id
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">📄</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-slate-900 truncate">{doc.filename}</h4>
                        <div className="flex gap-6 mt-2 text-sm text-slate-600">
                          <span>📊 {formatFileSize(doc.size)}</span>
                          <span>📅 {formatDate(doc.createdAt)}</span>
                          <span className="font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs">⏳ Pending Review</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition font-medium">
                        View
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenEditor(); }}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition font-medium">
                        Sign
                      </button>
                    </div>
                  </div>
                  {selectedDoc?.id === doc.id && (
                    <div className="mt-6 pt-6 border-t border-orange-200 grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-slate-600 font-semibold uppercase">Status</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">Pending Review</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold uppercase">File Size</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{formatFileSize(doc.size)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold uppercase">Uploaded</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{formatDate(doc.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold uppercase">Signatures</p>
                        <p className="text-sm font-bold text-orange-600 mt-1">0/1 Signed</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold uppercase">Actions</p>
                        <button className="text-sm font-bold text-orange-600 mt-1 hover:text-orange-700">Download →</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 text-center">
          <p className="text-slate-700">
            <span className="font-bold text-orange-600">💡 Pro Tip:</span> Your documents are automatically saved and organized.
          </p>
        </div>
      </main>
    </div>
  );
}