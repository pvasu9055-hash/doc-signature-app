import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { login } from '../api';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onLogin, onSwitchToRegister }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🖊️</span>
            <span className="text-white font-black text-2xl">DocSign</span>
          </div>
          <h2 className="text-3xl font-black text-white">Welcome back</h2>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="mb-4">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="Enter your email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="mb-6">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Enter your password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50">
            {isSubmitting ? '⏳ Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="text-orange-400 hover:text-orange-300 font-semibold">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}