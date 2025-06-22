"use client"; // Required for the contact form

import { useState } from 'react';
import styles from './contact.module.css'; // We'll create this next

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Placeholder handler - replace with actual email sending/API call
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFeedback(null);

        console.log('Contact form submitted:', { name, email, subject, message });
        // TODO: Implement actual form submission (e.g., send email via API route)

        // Simulate success
        setFeedback({ type: 'success', text: 'Thank you for your message! We will get back to you if necessary.' });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Contact Us</h1>
            <p className={styles.description}>
                Have questions, feedback, or need to report an issue? Please use the form below or contact us directly at [Your Contact Email Address - Optional].
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
                {feedback && (
                    <p className={`${styles.feedbackMessage} ${feedback.type === 'error' ? styles.error : styles.success}`}>
                    {feedback.text}
                    </p>
                )}

                <div className={styles.formRow}>
                     <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>Name</label>
                        <input type="text" id="name" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                    </div>
                     <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>Email Address</label>
                        <input type="email" id="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.label}>Subject</label>
                    <input type="text" id="subject" className={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.label}>Message</label>
                    <textarea id="message" rows={6} className={styles.textarea} value={message} onChange={(e) => setMessage(e.target.value)} required></textarea>
                </div>

                <button type="submit" className={styles.submitButton}>Send Message</button>
            </form>
        </div>
    );
}
