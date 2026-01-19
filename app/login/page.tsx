"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import styles from './login.module.css';
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      console.error('Supabase login error:', signInError);
      if (signInError.message === "Invalid login credentials") {
        setError("Invalid email or password. Please try again.");
      } else if (signInError.message === "Email not confirmed") {
        setError("Please confirm your email before logging in. Check your inbox for a confirmation link.");
      } else {
        setError(signInError.message || "An unexpected error occurred during login.");
      }
    } else if (data.user && data.session) {
      console.log('Login successful, user:', data.user);
      router.push('/');
      router.refresh();
    } else {
      setError("An unexpected issue occurred. Please try again.");
      console.log("Unexpected login response data:", data);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.logoHeader}>
        <Link href="/">
          <span style={{ color: 'var(--text-primary)' }}>News</span>
          <span style={{ color: 'var(--accent-primary)' }}>Grid</span>
        </Link>
      </div>

      <div className={styles.formContainer}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to your account to continue</p>
        
        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              disabled={isLoading}
              placeholder="Enter your email address"
              autoComplete="email"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                disabled={isLoading}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
              </button>
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className={styles.checkbox}
                disabled={isLoading}
              />
              Remember me
            </label>
            <Link href="/forgot-password" className={styles.inlineLink}>
              Forgot your password?
            </Link>
          </div>
          
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          
          <button type="submit" className={styles.primaryButton} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        
        <p className={styles.secondaryActionText}>
          Don&apos;t have an account? <Link href="/signup" className={styles.inlineLinkBold}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
