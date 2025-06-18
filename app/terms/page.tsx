import styles from './terms.module.css'; // We'll create this next

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Terms of Service</h1>
      <p className={styles.lastUpdated}>Last Updated: [Insert Date]</p>

      {/* === IMPORTANT: REPLACE ALL BELOW WITH YOUR ACTUAL TERMS === */}

      <section className={styles.section}>
        <h2 className={styles.subtitle}>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the NewsGrid platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>2. Content Submissions</h2>
        <p>
          You are solely responsible for the content you submit ("User Content"). You agree that your User Content will comply with our Submission Guidelines. You grant NewsGrid a worldwide, non-exclusive, royalty-free license to use, reproduce, distribute, and display your User Content in connection with the Service. You represent and warrant that you have all necessary rights to grant this license.
        </p>
        <p>
          NewsGrid does not endorse User Content and is not responsible or liable for its accuracy or legality. We reserve the right, but not the obligation, to remove or modify User Content for any reason, including violation of these Terms or our Submission Guidelines.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>3. User Conduct</h2>
        <p>
          You agree not to use the Service to submit content that is unlawful, harmful, defamatory, obscene, infringing, harassing, or otherwise objectionable. You agree not to disrupt the Service or interfere with other users' enjoyment of it.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>4. Accounts</h2>
        <p>
          If account creation is required, you are responsible for safeguarding your password and for any activities or actions under your account. You agree to notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>5. Disclaimers</h2>
        <p>
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis. NewsGrid disclaims all warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>6. Limitation of Liability</h2>
        <p>
          In no event shall NewsGrid, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>7. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction, e.g., State, Country], without regard to its conflict of law provisions.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>8. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least [Number] days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>
      </section>

       <section className={styles.section}>
        <h2 className={styles.subtitle}>9. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at [Your Contact Email or Link to Contact Page].
        </p>
      </section>
      {/* === END OF PLACEHOLDER CONTENT === */}

    </div>
  );
}
