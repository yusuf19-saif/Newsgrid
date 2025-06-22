"use client"; // Required for form interaction

import { useState, FormEvent } from 'react';
import Link from 'next/link'; // For linking back to login
import styles from './signup.module.css'; // We'll use this, but with new styles
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'; // Use the browser client

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState(''); // New state
  const [lastName, setLastName] = useState('');   // New state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added for loading state
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // const [showPassword, setShowPassword] = useState(false); // Can add if desired for consistency

  const supabase = createSupabaseBrowserClient(); // Create client instance

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    // Step 1: Sign up the user with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Pass names in options.data so the trigger can pick them up
        data: { 
          first_name: firstName,
          last_name: lastName,
          // full_name: `${firstName} ${lastName}` // Can also pass full_name if not auto-generated in DB
        } 
      },
    });

    setIsLoading(false); // Set loading to false after signUp call

    if (signUpError) {
      console.error('Supabase signup error:', signUpError);
      setError(signUpError.message);
    } else if (authData.user) {
      // Profile creation is now handled by the database trigger.
      console.log('Auth user created:', authData.user);
      if (authData.session) { // Email confirmation likely OFF
        setMessage("Signup successful! Your profile is being set up. Redirecting...");
        // router.push('/'); // Or wherever you want to redirect
      } else { // Email confirmation ON
        setMessage("Signup successful! Please check your email to confirm your account. Your profile will be ready once confirmed.");
      }
      // Clear fields on successful auth user creation
      setFirstName('');
      setLastName('');
      setEmail(''); 
      setPassword('');
    } else {
      setError("An unexpected issue occurred during signup. Please try again.");
      console.log("Unexpected signup response from auth:", authData);
    }
  };

  // const togglePasswordVisibility = () => setShowPassword(!showPassword); // If adding show/hide

  return (
    <div className={styles.authPageContainer}> {/* Matches login page style */}
      <div className={styles.logoHeader}> 
        <Link href="/">NewsGrid</Link> 
      </div>

      <div className={styles.formContainer}> 
        <h1 className={styles.title}>Create your free account</h1>
        
        <form className={styles.form} onSubmit={handleSignup}>
          <div className={styles.inputGroup}> {/* First Name */}
            <label htmlFor="firstName" className={styles.label}>First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={styles.input}
              disabled={isLoading}
              placeholder="Enter your first name"
            />
          </div>
          <div className={styles.inputGroup}> {/* Last Name */}
            <label htmlFor="lastName" className={styles.label}>Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={styles.input}
              disabled={isLoading}
              placeholder="Enter your last name"
            />
          </div>
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
            {/* Consider adding password show/hide toggle here for consistency with login */}
            <input
              type="password" // Change to type={showPassword ? "text" : "password"} if toggle is added
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={styles.input}
              disabled={isLoading}
              placeholder="Create a password (min. 6 characters)"
            />
          </div>
          
          {/* Terms and Privacy Policy Text */}
          <p className={styles.legalText}>
            By creating an account, you agree to the 
            <Link href="/terms" className={styles.inlineLink}> Terms of Service</Link> and 
            acknowledge our <Link href="/privacy" className={styles.inlineLink}> Privacy Policy</Link>.
          </p>
          
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.message}>{message}</p>} {/* Added for success/info messages */}
          
          <button type="submit" className={styles.primaryButton} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create account'}
          </button>
        </form>
        
        <p className={styles.secondaryActionText}>
          Already a subscriber? <Link href="/login" className={styles.inlineLinkBold}>Log in</Link>
        </p>

        <div className={styles.divider}>
          <span>Or</span>
        </div>

        {/* Social Login Buttons - structure similar to ground.news & your login page */}
        <button 
          type="button" 
          className={styles.socialButton} 
          onClick={() => { /* handleSocialSignup('google') */ setError('Social signup not implemented'); }}
          disabled={isLoading}
        >
          <span className={styles.iconPlaceholder}>G</span> 
          Continue with Google
        </button>
        <button 
          type="button" 
          className={styles.socialButton} 
          onClick={() => { /* handleSocialSignup('facebook') */ setError('Social signup not implemented'); }}
          disabled={isLoading}
        >
          <span className={styles.iconPlaceholder}>f</span> 
          Continue with Facebook
        </button>
        <button 
          type="button" 
          className={styles.socialButton} 
          onClick={() => { /* handleSocialSignup('apple') */ setError('Social signup not implemented'); }}
          disabled={isLoading}
        >
          <span className={styles.iconPlaceholder}></span> 
          Continue with Apple
        </button>
        
      </div>
    </div>
  );
}
