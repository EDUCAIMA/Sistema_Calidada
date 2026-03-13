"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Mail, 
  ArrowRight, 
  LifeBuoy,
  KeyRound,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simular envío de correo
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
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
        <div className="w-full max-w-[480px]">
          <div className="bg-[#111927]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-10">
            {success ? (
              <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-blue-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Correo enviado</h1>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  Hemos enviado las instrucciones de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.
                </p>
                <Link href="/">
                  <Button className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-600/20">
                    <KeyRound className="h-8 w-8 text-blue-500" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-3">Recuperar cuenta</h1>
                  <p className="text-slate-400 text-sm max-w-[300px] mx-auto leading-relaxed">
                    Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                      Correo electrónico
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ej. admin@empresa.com"
                        className="bg-[#1c2536] border-white/5 h-12 pl-11 text-white focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                        required
                      />
                    </div>
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
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Enviar instrucciones
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="p-8 text-center z-10">
        <div className="flex items-center justify-center gap-1.5 text-slate-500">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">QualityLink Security Protocol</span>
        </div>
      </footer>
    </div>
  );
}
