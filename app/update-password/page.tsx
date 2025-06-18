"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // For redirecting after success
import { createBrowserClient } from '@supabase/ssr';
import styles from './UpdatePassword.module.css'; // We'll create this CSS file next

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenProcessed, setIsTokenProcessed] = useState(false); // To prevent multiple token processing

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // This effect runs once on component mount to handle the session from the URL fragment
  useEffect(() => {
    if (isTokenProcessed) return;

    // This is the primary listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange event:', event, 'session:', session);

      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('PASSWORD_RECOVERY event received, session established.');
        setMessage("You can now set your new password.");
        setIsTokenProcessed(true);
        
        if (window.location.hash) {
          console.log('Clearing window.location.hash');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else if (session && !isTokenProcessed) {
        console.log('Session found, potentially after verify redirect.');
        setMessage("You can now set your new password.");
        setIsTokenProcessed(true);
        if (window.location.hash) {
          console.log('Clearing window.location.hash (from generic session)');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    });

    // Fallback if onAuthStateChange doesn't fire quickly or if there's no hash
    // This part might not be necessary if onAuthStateChange is reliable after the Supabase server-side redirect
    const currentHash = window.location.hash;
    if (!currentHash && !isTokenProcessed) {
        console.log('No hash found on load, and token not yet processed.');
        // setError("Invalid or expired recovery link. Please request a new one or ensure the link is correct.");
        // Setting an error here might be too aggressive if onAuthStateChange is about to fire.
        // We primarily rely on onAuthStateChange.
    }


    return () => {
      subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTokenProcessed, supabase.auth]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) { // Example: Enforce minimum password length
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (updateError) {
      console.error("Error updating password:", updateError);
      setError(updateError.message || "Failed to update password. Please try again.");
    } else {
      setMessage("Your password has been updated successfully! You can now log in with your new password.");
      // Optional: Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Set Your New Password</h1>
        
        {!isTokenProcessed && !error && <p className={styles.infoMessage}>Verifying recovery link...</p>}
        
        {/* Only show the form if the token has been processed and there's no overriding error */}
        {isTokenProcessed && !error && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter new password"
                disabled={isLoading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Confirm new password"
                disabled={isLoading}
              />
            </div>

            {message && <p className={styles.successMessage}>{message}</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}

            <button type="submit" className={styles.button} disabled={isLoading || !isTokenProcessed}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
        
        {/* Show error prominently if it occurs before/during token processing */}
        {!isTokenProcessed && error && <p className={styles.errorMessage}>{error}</p>}

      </div>
    </div>
  );
}
