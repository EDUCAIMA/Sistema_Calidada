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
  User,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [registerData, setRegisterData] = useState({
    fullname: '',
    company: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerData.password !== registerData.confirm) {
        setError('Las contraseñas no coinciden');
        return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: registerData.fullname,
          company: registerData.company,
          email: registerData.email,
          password: registerData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
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

        {/* Subtle Light Flares */}
        <div className="absolute top-[15%] left-[12%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(0,113,197,0.8)]" />
        <div className="absolute bottom-[25%] right-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(0,199,253,0.8)]" />
      </div>

      {/* Navigation Header */}
      <header className="p-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Shield className="h-6 w-6 text-white" fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">QualityLink</span>
        </Link>
        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2">
          <LifeBuoy className="h-4 w-4" />
          Ayuda
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-[540px]">
          <div className="bg-[#111927]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 lg:p-10">
            {success ? (
              <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">¡Registro Exitoso!</h1>
                <p className="text-slate-400">
                  Tu solicitud ha sido enviada. Serás redirigido al login en unos segundos.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-3">Solicitar acceso</h1>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[320px] mx-auto">
                    Únete a la plataforma líder en gestión de calidad para empresas.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="fullname" className="text-sm font-medium text-slate-300">Nombre completo</Label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <Input id="fullname" placeholder="Juan Pérez" value={registerData.fullname} onChange={e => setRegisterData({...registerData, fullname: e.target.value})} className="bg-[#1c2536] border-white/5 h-11 pl-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600" required />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="company" className="text-sm font-medium text-slate-300">Empresa</Label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Building className="h-4 w-4" />
                      </div>
                      <Input id="company" placeholder="Nombre de tu empresa" value={registerData.company} onChange={e => setRegisterData({...registerData, company: e.target.value})} className="bg-[#1c2536] border-white/5 h-11 pl-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600" required />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-300">Correo corporativo</Label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input id="email" type="email" placeholder="ej. contacto@empresa.com" value={registerData.email} onChange={e => setRegisterData({...registerData, email: e.target.value})} className="bg-[#1c2536] border-white/5 h-11 pl-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600" required />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-300">Contraseña</Label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})} className="bg-[#1c2536] border-white/5 h-11 pl-11 pr-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="confirm" className="text-sm font-medium text-slate-300">Confirmar</Label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input id="confirm" type={showPassword ? "text" : "password"} placeholder="••••••••" value={registerData.confirm} onChange={e => setRegisterData({...registerData, confirm: e.target.value})} className="bg-[#1c2536] border-white/5 h-11 pl-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600" required />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                      <Checkbox id="terms" className="mt-1 border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" required />
                      <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                        Al registrarte, aceptas nuestros <span className="text-blue-500 hover:underline">Términos de Servicio</span> y la <span className="text-blue-500 hover:underline">Política de Privacidad</span>.
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
                          Procesando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Crear cuenta
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <p className="text-sm text-slate-400">
                    ¿Ya tienes una cuenta?{' '}
                    <Link href="/" className="text-blue-500 font-semibold hover:underline">
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="p-8 text-center z-10">
        <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-4">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Cumplimiento ISO 9001:2015</span>
        </div>
      </footer>
    </div>
  );
}
