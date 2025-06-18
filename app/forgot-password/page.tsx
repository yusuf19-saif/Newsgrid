"use client";

import { useState, FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from './ForgotPassword.module.css'; // We'll create this CSS file next

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, // URL to redirect to after clicking email link
    });

    setIsLoading(false);

    if (resetError) {
      console.error("Error sending password reset email:", resetError);
      setError(resetError.message || "Failed to send reset email. Please try again.");
    } else {
      setMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Forgot Your Password?</h1>
        <p className={styles.subtitle}>
          No problem! Enter your email address below, and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          {message && <p className={styles.successMessage}>{message}</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className={styles.backToLogin}>
          <Link href="/login">Remember your password? Log In</Link>
        </div>
      </div>
    </div>
  );
}
