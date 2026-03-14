"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  LifeBuoy,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar sesión en localStorage
      localStorage.setItem('sgc_user', JSON.stringify(data.user));
      localStorage.setItem('sgc_tenant', JSON.stringify(data.tenant));

      // Redirigir según rol
      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/admin-portal');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000814] text-slate-200 font-sans flex flex-col relative overflow-hidden">
      {/* Background Decorative Elements - Intel-style Blue Gradients & Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main Radial Gradients (Intel Blues) */}
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ backgroundColor: '#0071c5' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] blur-[150px] rounded-full mix-blend-screen" style={{ backgroundColor: '#00c7fd' }} />

        {/* Wavy Organic Shapes (SVG) - Blue variations */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M0,1000 C300,800 400,950 700,700 C900,550 1000,700 1000,700 L1000,1000 Z" fill="#003a70" />
          <path d="M0,1000 C200,850 300,900 600,650 C800,500 1000,650 1000,650 L1000,1000 Z" fill="#0071c5" opacity="0.5" />
          <path d="M0,0 C300,200 400,50 700,300 C900,450 1000,300 1000,300 L1000,0 Z" fill="#001e3c" />
        </svg>

        {/* Dotted Patterns */}
        <div className="absolute top-20 right-40 w-32 h-32 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
        <div className="absolute bottom-40 left-20 w-48 h-24 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

        {/* Abstract Geometric Shapes */}
        <div className="absolute top-1/4 left-10 w-8 h-8 border-2 border-white/10 rotate-45" />
        <div className="absolute bottom-1/4 right-20 w-12 h-12 border border-blue-500/10 rounded-full" />
        <div className="absolute top-1/2 right-1/3 w-0 h-0 border-l-[15px] border-l-transparent border-b-[25px] border-b-blue-500/10 border-r-[15px] border-r-transparent -rotate-12" />

        {/* Subtle Light Flares */}
        <div className="absolute top-[15%] left-[12%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(0,113,197,0.8)]" />
        <div className="absolute bottom-[25%] right-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(0,199,253,0.8)]" />
      </div>

      {/* Navigation Header */}
      <header className="p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Shield className="h-6 w-6 text-white" fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">QualityLink</span>
        </div>
        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2">
          <LifeBuoy className="h-4 w-4" />
          Soporte
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-[480px]">
          <div className="bg-[#111927]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white mb-3">Bienvenido de nuevo</h1>
              <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                Por favor, introduce tus credenciales para acceder al panel de QMS.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Usuario o Correo electrónico
                </Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ej. admin@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-[#1c2536] border-white/5 h-12 pl-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                    Contraseña
                  </Label>
                  <Link href="/forgot-password" title="Recuperar contraseña" className="text-xs font-semibold text-blue-500 hover:text-blue-400 hover:underline transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-[#1c2536] border-white/5 h-12 pl-11 pr-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox id="remember" className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">
                  Mantener sesión iniciada por 30 días
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Autenticando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Iniciar sesión
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium mb-3">
                © 2024 QualityLink Systems. Todos los derechos reservados.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-slate-400">
                <Shield className="h-3 w-3" />
                <span className="text-[10px] font-semibold">Cumplimiento SOC2 e ISO 9001 Certificado</span>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="text-blue-500 font-semibold hover:underline">
                Solicitar acceso
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="p-8 text-center z-10">
        <div className="flex justify-center gap-8">
          {['Política de Privacidad', 'Términos de Servicio', 'Estado del Sistema'].map((link) => (
            <button key={link} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              {link}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
