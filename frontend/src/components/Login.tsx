import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { login } from '../api';
import GoogleLoginButton from './GoogleLoginButton';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

const FALLBACK_NEWS = [
  { tag: 'INDUSTRY', text: 'eSignature market projected to reach $35.6B by 2029 — Forbes', time: '2h ago' },
  { tag: 'SECURITY', text: 'EU eIDAS 2.0 regulation mandates stronger digital identity for all signers', time: '4h ago' },
  { tag: 'LEGAL', text: 'US courts confirm electronic signatures hold same legal weight as wet ink', time: '6h ago' },
  { tag: 'TREND', text: 'Remote work surge drives 340% increase in digital document workflows', time: '8h ago' },
  { tag: 'TECH', text: 'AI-powered contract analysis cuts review time by 80% for Fortune 500 firms', time: '12h ago' },
  { tag: 'COMPLIANCE', text: 'HIPAA-compliant eSignatures now required for all US healthcare providers', time: '1d ago' },
  { tag: 'GLOBAL', text: 'India\'s DigiLocker surpasses 150M users — digital signatures mainstream', time: '1d ago' },
];

const QUOTES = [
  { type: 'LIFE', text: 'The only way to do great work is to love what you do.' },
  { type: 'LOVE', text: 'In the end, we will remember not the words of our enemies, but the silence of our friends.' },
  { type: 'LIFE', text: 'Your time is limited, don\'t waste it living someone else\'s life.' },
  { type: 'LOVE', text: 'To love oneself is the beginning of a lifelong romance.' },
  { type: 'LIFE', text: 'The future belongs to those who believe in the beauty of their dreams.' },
  { type: 'LOVE', text: 'Love is the bridge between two hearts beating as one.' },
  { type: 'LIFE', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.' },
  { type: 'LOVE', text: 'You are the finest, loveliest, tenderest, and most beautiful person I have ever known.' },
];

const STATS = [
  { value: '2.4B+', label: 'Documents signed digitally in 2024' },
  { value: '99.9%', label: 'Legal validity across 180+ countries' },
  { value: '78%', label: 'Faster than traditional paper signing' },
];

const TAG_COLORS: Record<string, string> = {
  INDUSTRY: 'bg-blue-500/20 text-blue-400',
  SECURITY: 'bg-red-500/20 text-red-400',
  LEGAL: 'bg-purple-500/20 text-purple-400',
  TREND: 'bg-green-500/20 text-green-400',
  TECH: 'bg-orange-500/20 text-orange-400',
  COMPLIANCE: 'bg-yellow-500/20 text-yellow-400',
  GLOBAL: 'bg-cyan-500/20 text-cyan-400',
};

const QUOTE_COLORS: Record<string, string> = {
  LIFE: 'bg-purple-500/20 text-purple-400',
  LOVE: 'bg-pink-500/20 text-pink-400',
};

function getTag(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('security') || t.includes('hack') || t.includes('breach')) return 'SECURITY';
  if (t.includes('law') || t.includes('legal') || t.includes('court') || t.includes('regulation')) return 'LEGAL';
  if (t.includes('ai') || t.includes('tech') || t.includes('software') || t.includes('digital')) return 'TECH';
  if (t.includes('comply') || t.includes('compliance') || t.includes('hipaa') || t.includes('gdpr')) return 'COMPLIANCE';
  if (t.includes('global') || t.includes('world') || t.includes('india') || t.includes('eu') || t.includes('europe')) return 'GLOBAL';
  if (t.includes('trend') || t.includes('remote') || t.includes('growth') || t.includes('surge')) return 'TREND';
  return 'INDUSTRY';
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return '1d ago';
  }
}

export default function Login({ onLogin, onSwitchToRegister }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeNews, setActiveNews] = useState(0);
  const [activeQuote, setActiveQuote] = useState(0);
  const [ticker, setTicker] = useState(0);
  const [newsHeadlines, setNewsHeadlines] = useState(FALLBACK_NEWS);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showNews, setShowNews] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  // Fetch real news from NewsData.io
  useEffect(() => {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    if (!apiKey) { setNewsLoading(false); return; }

    fetch(`https://newsdata.io/api/1/news?apikey=${apiKey}&q=esignature+OR+digital+signature+OR+document+signing&language=en&size=7`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const mapped = data.results.slice(0, 7).map((item: any) => ({
            tag: getTag(item.title || ''),
            text: item.title,
            time: timeAgo(item.pubDate),
          }));
          setNewsHeadlines(mapped);
        }
      })
      .catch(() => {}) // keep fallback
      .finally(() => setNewsLoading(false));
  }, []);

  // Rotate news
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNews(prev => (prev + 1) % newsHeadlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [newsHeadlines]);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuote(prev => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Toggle news/quotes every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowNews(prev => !prev);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await login(data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col w-[55%] bg-[#07090f] border-r border-white/5 relative overflow-hidden p-10">

        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-2 mb-12 relative z-10">
          <span className="text-2xl">🖊️</span>
          <span className="text-white font-black text-xl tracking-tight">DocSign</span>
          <span className="ml-2 text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">ENTERPRISE</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 mb-10">
          <p className="text-orange-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Document Intelligence Platform</p>
          <h1 className="text-white font-black text-4xl leading-tight mb-4">
            Sign. Send.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Close deals faster.</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
            Enterprise-grade document signing with AI-powered summaries, audit trails, and legally binding signatures across 180+ countries.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-10 relative z-10">
          {STATS.map((stat, i) => (
            <div key={i} className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-white font-black text-xl">{stat.value}</div>
              <div className="text-slate-300 text-xs mt-1 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* News & Quotes Feed */}
        <div className="relative z-10 flex-1">
          {showNews ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${newsLoading ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`} />
                <span className="text-slate-300 text-xs font-bold tracking-widest uppercase">
                  {newsLoading ? 'Loading Live Feed...' : 'Live Industry News'}
                </span>
              </div>

              <div className="space-y-2">
                {newsHeadlines.map((news, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-500 cursor-default ${
                      i === activeNews
                        ? 'bg-white/[0.05] border-white/10 opacity-100'
                        : 'border-transparent opacity-40'
                    }`}
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${TAG_COLORS[news.tag] || TAG_COLORS['INDUSTRY']}`}>
                      {news.tag}
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed flex-1 line-clamp-2">{news.text}</p>
                    <span className="text-slate-500 text-[10px] shrink-0">{news.time}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                <span className="text-slate-300 text-xs font-bold tracking-widest uppercase">Daily Inspiration</span>
              </div>

              <div className="flex flex-col gap-4 h-full justify-center">
                {QUOTES.map((quote, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border transition-all duration-700 ${
                      i === activeQuote
                        ? `${QUOTE_COLORS[quote.type]} border-current opacity-100 scale-100`
                        : 'border-transparent opacity-0 scale-95 absolute'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${QUOTE_COLORS[quote.type]}`}>
                        {quote.type}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed italic">"{quote.text}"</p>
                  </div>
                ))}
              </div>

              <p className="text-slate-500 text-[10px] text-center mt-4">✨ New quote every 5 seconds</p>
            </>
          )}
        </div>

        {/* Toggle indicator */}
        <div className="relative z-10 mt-4 text-center">
          <p className="text-slate-600 text-[10px]">{showNews ? '📰 News mode' : '💭 Inspiration mode'} • Auto-switches</p>
        </div>

        {/* Ticker */}
        <div className="relative z-10 mt-6 border-t border-white/5 pt-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-[10px] font-bold shrink-0">TRENDING</span>
            <div className="overflow-hidden flex-1">
              <p className="text-slate-500 text-[11px] whitespace-nowrap"
                style={{ transform: `translateX(${-((ticker * 0.5) % 600)}px)`, transition: 'none' }}>
                eSignature • Digital Audit Trail • AI Contract Analysis • HIPAA Compliance • DocuSign • Adobe Sign • PandaDoc • HelloSign • Legal Tech • Remote Signing • Blockchain Verification • eIDAS 2.0 • Digital Notary
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🖊️</span>
            <span className="text-white font-black text-xl">DocSign</span>
          </div>

          <div className="mb-8">
            <h2 className="text-white font-black text-2xl mb-1">Welcome back</h2>
            <p className="text-slate-300 text-sm">Sign in to your workspace</p>
          </div>

          <div className="mb-6">
            <GoogleLoginButton />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-300 text-xs">or continue with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="mb-4">
            <label className="text-slate-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@company.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</label>
              <button type="button" className="text-orange-400 text-xs hover:text-orange-300 transition">Forgot password?</button>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs transition"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? '⏳ Signing in...' : 'Sign In →'}
          </button>

          <p className="text-center text-slate-300 text-xs mt-6">
            No account?{' '}
            <button onClick={onSwitchToRegister} className="text-orange-400 hover:text-orange-300 font-semibold transition">
              Create workspace
            </button>
          </p>

          <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-white/5">
            <span className="text-slate-400 text-[10px]">🔒 SOC 2</span>
            <span className="text-slate-400 text-[10px]">✅ HIPAA</span>
            <span className="text-slate-400 text-[10px]">🌍 eIDAS</span>
            <span className="text-slate-400 text-[10px]">⚖️ ESIGN Act</span>
          </div>
        </div>
      </div>
    </div>
  );
}