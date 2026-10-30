"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, LockKeyhole, ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { LoginCarousel } from '@/components/login-carousel';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');
      localStorage.setItem('sgc_user', JSON.stringify(data.user));
      localStorage.setItem('sgc_tenant', JSON.stringify(data.tenant));
      router.push(data.user.role === 'SUPER_ADMIN' ? '/admin-portal' : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="QualityLink, inicio">
          <Shield aria-hidden="true" strokeWidth={2.7} />
          <span>Quality<span className={styles.brandAccent}>Link</span></span>
        </Link>
      </header>
      <main className={styles.main}>
        <LoginCarousel />
        <section className={styles.loginPanel} aria-labelledby="login-title">
          <div className={styles.formContainer}>
            <h1 id="login-title" className={styles.heading}>Bienvenido de nuevo</h1>
            <p className={styles.intro}>Accede a tu sistema de gestión de calidad.</p>
            <form onSubmit={handleLogin} className={styles.form} aria-busy={loading}>
              {error && <div className={styles.error} role="alert" id="login-error">{error}</div>}
              <div className={styles.field}>
                <label htmlFor="email">Correo electrónico</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={21} aria-hidden="true" />
                  <input
                    id="email" name="email" type="email" autoComplete="username"
                    autoCapitalize="none" spellCheck={false} placeholder="nombre@empresa.com"
                    value={email} onChange={event => setEmail(event.target.value)}
                    className={styles.input} required disabled={loading}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="password">Contraseña</label>
                <div className={styles.inputWrapper}>
                  <LockKeyhole className={styles.inputIcon} size={21} aria-hidden="true" />
                  <input
                    id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="••••••••"
                    value={password} onChange={event => setPassword(event.target.value)}
                    className={`${styles.input} ${styles.passwordInput}`} required disabled={loading}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                  <button
                    type="button" className={styles.passwordToggle}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}
                  >
                    {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                  </button>
                </div>
              </div>
              <div className={styles.formOptions}>
                <label className={styles.remember} title="Mantener sesión iniciada por 30 días">
                  <input type="checkbox" name="remember" checked={remember}
                    onChange={event => setRemember(event.target.checked)} disabled={loading} />
                  Recordarme
                </label>
                <Link href="/forgot-password" className={styles.textLink}>¿Olvidaste tu contraseña?</Link>
              </div>
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? <><LoaderCircle size={21} className={styles.spinner} aria-hidden="true" /> Iniciando sesión…</> : <>Iniciar sesión <ArrowRight size={22} aria-hidden="true" /></>}
              </button>
              <p className={styles.register}>¿No tienes una cuenta? <Link href="/register" className={styles.textLink}>Solicitar acceso</Link></p>
            </form>
          </div>
          <footer className={styles.footer}>QualityLink <span aria-hidden="true">·</span> Sistema de gestión de calidad</footer>
        </section>
      </main>
    </div>
  );
}
