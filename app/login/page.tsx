"use client"; // Required for form interaction (event handlers, state eventually)

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // For linking to signup
import { createBrowserClient } from '@supabase/ssr'; // Use directly from @supabase/ssr
import styles from './login.module.css'; // We'll create this next
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs'; // Eye icons
// import { useRouter } from 'next/navigation'; // Needed later for redirect after login

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(''); // State for email/username
  const [password, setPassword] = useState(''); // State for password
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // Initialize Supabase client directly in the component
  // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in your .env.local
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Placeholder login handler
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
      // Session is automatically handled by the Supabase client library (cookies/localStorage)
      
      router.push('/'); // Redirect to the homepage
      router.refresh(); // CRUCIAL: Refresh server components to update auth state (e.g., Header)
    } else {
      // This case should ideally not be reached if signInError or data.user/session is always populated.
      setError("An unexpected issue occurred. Please try again.");
      console.log("Unexpected login response data:", data);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple' | 'facebook') => {
    // Placeholder for OAuth functionality
    console.log(`Attempting to log in with ${provider}`);
    setError(`Login with ${provider} is not yet implemented.`);
    // Actual implementation:
    // await supabase.auth.signInWithOAuth({ 
    //   provider,
    //   options: { redirectTo: `${window.location.origin}/auth/callback` } 
    // });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.logoHeader}>
        <Link href="/">NewsGrid</Link>
      </div>

      <div className={styles.formContainer}>
        <h1 className={styles.title}>Log in to your account</h1>
        
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
          
          {error && <p className={styles.error}>{error}</p>}
          
          <button type="submit" className={styles.primaryButton} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        
        <p className={styles.secondaryActionText}>
          Don&apos;t have an account? <Link href="/signup" className={styles.inlineLinkBold}>Create one</Link>
        </p>

        <div className={styles.divider}>
          <span>Or</span>
        </div>

        <button 
          type="button" 
          className={styles.socialButton} 
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
        >
          <span className={styles.iconPlaceholder}>G</span>
          Continue with Google
        </button>
        <button 
          type="button" 
          className={styles.socialButton} 
          onClick={() => handleSocialLogin('facebook')}
          disabled={isLoading}
        >
          <span className={styles.iconPlaceholder}>f</span>
          Continue with Facebook
        </button>
        <button 
          type="button" 
          className={styles.socialButton} 
          onClick={() => handleSocialLogin('apple')}
          disabled={isLoading}
        >
          <span className={styles.iconPlaceholder}></span>
          Continue with Apple
        </button>
      </div>
    </div>
  );
}
