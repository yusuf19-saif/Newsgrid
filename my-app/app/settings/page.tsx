"use client"; // Required for form interaction and state

import { useState, useEffect, FormEvent } from 'react';
import styles from './settings.module.css'; // This now points to our new themed CSS
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'; // For fetching and updating

export default function SettingsPage() {
  // Profile Info State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // State for password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // State for email change form
  const [emailPassword, setEmailPassword] = useState(''); // Password to confirm email change
  const [newEmail, setNewEmail] = useState('');

  // General message state (for success/error feedback)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createSupabaseBrowserClient();

  // Fetch current user's profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfileMessage({ type: 'error', text: 'Could not load profile data.' });
        } else if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
        }
      } else {
        setProfileMessage({ type: 'error', text: 'You must be logged in to view settings.' });
        // Optionally redirect to login if no user
        // router.push('/login'); 
      }
      setIsLoadingProfile(false);
    };

    fetchUserProfile();
  }, [supabase]);

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(null);
    // TODO: API call to update profile (first_name, last_name)
    // For now, we'll simulate it and then build the API route.
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setProfileMessage({ type: 'error', text: 'You are not logged in.' });
        return;
    }

    if (!firstName.trim() || !lastName.trim()) {
        setProfileMessage({ type: 'error', text: 'First and last names cannot be empty.' });
        return;
    }

    // Call the API route we will create next
    try {
        const response = await fetch('/api/profile', { // Assuming API route is /api/profile
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName }),
        });

        const result = await response.json();

        if (!response.ok) {
            setProfileMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
        } else {
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            // Optionally re-fetch profile data or update local state if API returns updated profile
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
  };

  // Placeholder handlers - Replace with API calls later
  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null); // Clear previous messages
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
        setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
        return;
    }
    console.log('Attempting password change:', { currentPassword, newPassword });
    // TODO: API call to change password
    setMessage({ type: 'success', text: 'Password change simulated. (Not implemented)' });
    // Clear fields on success simulation
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleEmailChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    console.log('Attempting email change:', { emailPassword, newEmail });
    // TODO: API call to change email
    setMessage({ type: 'success', text: 'Email change simulated. (Not implemented)' });
    // Clear fields on success simulation
    setEmailPassword('');
    setNewEmail('');
  };

  const handleDeleteAccount = () => {
    setMessage(null);
    // IMPORTANT: This needs significant confirmation steps in a real app!
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
        if (window.confirm('Second confirmation: Really delete account? All your data will be lost.')) {
            console.log('Attempting account deletion...');
            // TODO: API call to delete account
            setMessage({ type: 'error', text: 'Account deletion simulated. (Not implemented)' });
            // TODO: Log user out and redirect
        }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Account Settings</h1>

      {/* Display Success/Error Messages */}
      {message && (
        <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
          {message.text}
        </p>
      )}
      {profileMessage && (
         <p className={`${styles.message} ${profileMessage.type === 'error' ? styles.error : styles.success}`}>
            {profileMessage.text}
        </p>
      )}

      {/* Update Profile Information Section */}
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Update Profile Information</h2>
        {isLoadingProfile ? (
          <p>Loading profile...</p>
        ) : (
          <form className={styles.form} onSubmit={handleProfileUpdate}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>First Name</label>
              <input 
                type="text" 
                id="firstName" 
                className={styles.input} 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                className={styles.input} 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className={styles.button}>Update Profile</button>
          </form>
        )}
      </section>

      {/* Change Password Section */}
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Change Password</h2>
        <form className={styles.form} onSubmit={handlePasswordChange}>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.label}>Current Password</label>
            <input type="password" id="currentPassword" className={styles.input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>New Password</label>
            <input type="password" id="newPassword" className={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmNewPassword" className={styles.label}>Confirm New Password</label>
            <input type="password" id="confirmNewPassword" className={styles.input} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <button type="submit" className={styles.button}>Update Password</button>
        </form>
      </section>

      {/* Change Email Section */}
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Change Email Address</h2>
        <form className={styles.form} onSubmit={handleEmailChange}>
           <div className={styles.formGroup}>
            <label htmlFor="emailPassword" className={styles.label}>Confirm Current Password</label>
            <input type="password" id="emailPassword" className={styles.input} value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required autoComplete="current-password"/>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="newEmail" className={styles.label}>New Email Address</label>
            <input type="email" id="newEmail" className={styles.input} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required autoComplete="email" />
          </div>
          <button type="submit" className={styles.button}>Update Email</button>
        </form>
      </section>

      {/* Delete Account Section */}
      <section className={`${styles.section} ${styles.dangerZone}`}>
        <h2 className={`${styles.subtitle} ${styles.dangerTitle}`}>Danger Zone</h2>
         <p className={styles.dangerText}>Deleting your account is permanent and cannot be undone. All your submitted articles and data will be lost.</p>
        <button onClick={handleDeleteAccount} className={`${styles.button} ${styles.deleteButton}`}>
          Delete My Account
        </button>
      </section>

    </div>
  );
}
