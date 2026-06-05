function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-10 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🖊️</span>
          <span className="font-black text-xl tracking-tight">DocSign</span>
        </div>
        <div className="flex gap-3">
          <button className="text-slate-400 hover:text-white px-4 py-2 transition">Login</button>
          <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/30">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center pt-40 pb-20 px-4">
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-5 py-1.5 rounded-full text-sm mb-8 tracking-wide">
          ✦ Enterprise-Grade Digital Signatures
        </div>
        <h1 className="text-6xl md:text-8xl font-black leading-none mb-6 tracking-tighter">
          Sign. Send.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
            Done.
          </span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          The most secure way to upload, sign, and share documents. Built for teams that move fast.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3.5 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/30 hover:opacity-90 transition">
            Start Signing Free →
          </button>
          <button className="border border-white/10 bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-2xl text-lg transition">
            Watch Demo ▶
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-12 mt-16 text-center">
          {[
            { val: "10K+", label: "Documents Signed" },
            { val: "99.9%", label: "Uptime" },
            { val: "256-bit", label: "Encryption" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-white">{s.val}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: "🔐", title: "JWT Authentication", desc: "Secure login with access & refresh tokens. Your data stays yours.", color: "from-blue-500/20 to-blue-500/5" },
          { icon: "📄", title: "PDF Upload & Sign", desc: "Drag & drop your signature anywhere on the document with pixel precision.", color: "from-cyan-500/20 to-cyan-500/5" },
          { icon: "📋", title: "Full Audit Trail", desc: "Every action logged — who signed, when, and from which IP address.", color: "from-teal-500/20 to-teal-500/5" },
          { icon: "🔗", title: "Shareable Links", desc: "Send tokenized signing links to anyone, no account required.", color: "from-purple-500/20 to-purple-500/5" },
          { icon: "⚡", title: "Instant PDF Export", desc: "Get your signed PDF instantly, embedded and tamper-proof.", color: "from-yellow-500/20 to-yellow-500/5" },
          { icon: "🛡️", title: "Compliance Ready", desc: "Built with legal, HR, and finance workflows in mind.", color: "from-pink-500/20 to-pink-500/5" },
        ].map((f) => (
          <div key={f.title} className={`bg-gradient-to-br ${f.color} border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:scale-[1.02] transition-all duration-200`}>
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 text-center py-6 text-slate-600 text-sm">
        DocSign © 2024 — Built with React + Node.js + PostgreSQL 🚀
      </div>
    </div>
  )
}

export default App