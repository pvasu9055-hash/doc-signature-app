import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { register as registerUser } from '../api';
import GoogleLoginButton from './GoogleLoginButton';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type FormData = z.infer<typeof schema>;

interface Props {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

const FALLBACK_NEWS = [
  { tag: 'INDUSTRY', text: 'eSignature market projected to reach $35.6B by 2029 — Forbes', time: '2h ago' },
  { tag: 'SECURITY', text: 'EU eIDAS 2.0 regulation mandates stronger digital identity for all signers', time: '4h ago' },
  { tag: 'LEGAL', text: 'US courts confirm electronic signatures hold same legal weight as wet ink', time: '6h ago' },
  { tag: 'TREND', text: 'Remote work surge drives 340% increase in digital document workflows', time: '8h ago' },
  { tag: 'TECH', text: 'AI-powered contract analysis cuts review time by 80% for Fortune 500 firms', time: '12h ago' },
  { tag: 'COMPLIANCE', text: 'HIPAA-compliant eSignatures now required for all US healthcare providers', time: '1d ago' },
  { tag: 'GLOBAL', text: "India's DigiLocker surpasses 150M users — digital signatures mainstream", time: '1d ago' },
];

const FEATURES = [
  { icon: '🖊️', title: 'Legally binding signatures', desc: 'Valid in 180+ countries under ESIGN, eIDAS & more' },
  { icon: '🤖', title: 'AI document summaries', desc: 'Groq-powered instant contract analysis' },
  { icon: '🔐', title: 'Tamper-proof audit trail', desc: 'Every action logged with timestamp & IP address' },
  { icon: '⚡', title: 'Sign in seconds', desc: 'Draw, type or upload your signature instantly' },
  { icon: '🔗', title: 'Shareable sign links', desc: 'Send documents to anyone — no account needed' },
  { icon: '📄', title: 'Signed PDF generation', desc: 'Download court-admissible signed documents' },
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

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
    { label: 'Very Strong', color: 'bg-green-400' },
  ];
  return { score, ...levels[score] };
}

export default function Register({ onRegister, onSwitchToLogin }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [activeNews, setActiveNews] = useState(0);
  const [ticker, setTicker] = useState(0);
  const [newsHeadlines, setNewsHeadlines] = useState(FALLBACK_NEWS);
  const [newsLoading, setNewsLoading] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const strength = getPasswordStrength(passwordValue);

  // Fetch real news
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
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNews(prev => (prev + 1) % newsHeadlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [newsHeadlines]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password });
      alert('✅ Account created! Please login.');
      onRegister();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col w-[55%] bg-[#07090f] border-r border-white/5 relative overflow-hidden p-10">

        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 relative z-10">
          <span className="text-2xl">🖊️</span>
          <span className="text-white font-black text-xl tracking-tight">DocSign</span>
          <span className="ml-2 text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">ENTERPRISE</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 mb-8">
          <p className="text-orange-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Free forever for individuals</p>
          <h1 className="text-white font-black text-4xl leading-tight mb-4">
            Everything you need<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">to sign smarter.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Join thousands of professionals who've replaced paper forms and email chains with DocSign's intelligent document platform.
          </p>
        </div>

        {/* Features grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mb-8">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition">
              <div className="text-xl mb-2">{f.icon}</div>
              <div className="text-white text-xs font-bold mb-1">{f.title}</div>
              <div className="text-slate-500 text-[11px] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Live news feed */}
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${newsLoading ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`} />
            <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">
              {newsLoading ? 'Loading Live Feed...' : 'Live Industry Feed'}
            </span>
          </div>
          <div className="space-y-1">
            {newsHeadlines.slice(0, 3).map((news, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-500 cursor-default ${
                  i === activeNews % 3
                    ? 'bg-white/[0.05] border-white/10 opacity-100'
                    : 'border-transparent opacity-40'
                }`}
              >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${TAG_COLORS[news.tag] || TAG_COLORS['INDUSTRY']}`}>
                  {news.tag}
                </span>
                <p className="text-slate-300 text-xs leading-relaxed flex-1 line-clamp-1">{news.text}</p>
                <span className="text-slate-600 text-[10px] shrink-0">{news.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
          <div className="flex -space-x-2">
            {['🧑‍💼','👩‍⚕️','👨‍💻','👩‍🏫','🧑‍🔬'].map((emoji, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs">{emoji}</div>
            ))}
          </div>
          <p className="text-slate-500 text-xs"><span className="text-white font-bold">2,400+</span> professionals signed up this week</p>
        </div>

        {/* Ticker */}
        <div className="relative z-10 mt-4 border-t border-white/5 pt-3 overflow-hidden">
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
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🖊️</span>
            <span className="text-white font-black text-xl">DocSign</span>
          </div>

          <div className="mb-8">
            <h2 className="text-white font-black text-2xl mb-1">Create your workspace</h2>
            <p className="text-slate-500 text-sm">Free forever · No credit card required</p>
          </div>

          <div className="mb-6">
            <GoogleLoginButton />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-600 text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="text-slate-400 text-xs font-semibold mb-2 block uppercase tracking-wider">Full Name</label>
            <input
              {...register('name')}
              type="text"
              placeholder="John Smith"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-slate-400 text-xs font-semibold mb-2 block uppercase tracking-wider">Work Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@company.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="text-slate-400 text-xs font-semibold mb-2 block uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                onChange={(e) => setPasswordValue(e.target.value)}
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
            {passwordValue && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.color : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className="text-xs mt-1 text-slate-500">{strength.label}</p>
              </div>
            )}
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="text-slate-400 text-xs font-semibold mb-2 block uppercase tracking-wider">Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition"
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? '⏳ Creating workspace...' : 'Create Free Account →'}
          </button>

          <p className="text-center text-slate-600 text-xs mt-4">
            By signing up you agree to our{' '}
            <span className="text-slate-400 hover:text-white cursor-pointer transition">Terms of Service</span>
            {' '}and{' '}
            <span className="text-slate-400 hover:text-white cursor-pointer transition">Privacy Policy</span>
          </p>

          <p className="text-center text-slate-600 text-xs mt-4">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-orange-400 hover:text-orange-300 font-semibold transition">
              Sign in
            </button>
          </p>

          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/5">
            <span className="text-slate-700 text-[10px]">🔒 SOC 2</span>
            <span className="text-slate-700 text-[10px]">✅ HIPAA</span>
            <span className="text-slate-700 text-[10px]">🌍 eIDAS</span>
            <span className="text-slate-700 text-[10px]">⚖️ ESIGN Act</span>
          </div>
        </div>
      </div>
    </div>
  );
}