import Dashboard from './components/Dashboard';
import PDFEditor from './components/PDFEditor';
import { useState } from 'react';

function App() {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');

  return (
    <>
      {view === 'dashboard' ? (
        <Dashboard onOpenEditor={() => setView('editor')} />
      ) : (
        <div>
          <button
            onClick={() => setView('dashboard')}
            className="fixed top-4 left-4 z-50 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition"
          >
            ← Back to Dashboard
          </button>
          <PDFEditor
            documentId={1}
            onSave={(signatures) => {
              console.log('Saved:', signatures);
              setView('dashboard');
            }}
          />
        </div>
      )}
    </>
  );
}

export default App;