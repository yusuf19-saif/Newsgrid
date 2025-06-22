import styles from './privacy.module.css'; // We'll create this next

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.lastUpdated}>Last Updated: [Insert Date]</p>

      {/* === IMPORTANT: REPLACE ALL BELOW WITH YOUR ACTUAL POLICY === */}

      <section className={styles.section}>
        <h2 className={styles.subtitle}>1. Introduction</h2>
        <p>
          This Privacy Policy explains how NewsGrid ("we," "us," or "our") collects, uses, and discloses information about you when you access or use our website and services (collectively, the "Service"). We are committed to protecting your privacy.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>2. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you create an account, submit content, or communicate with us. This may include:
        </p>
        <ul className={styles.subList}>
             <li>Account Information: Username, email address, password.</li>
             <li>User Content: Articles, comments, or other information you submit.</li>
             <li>Communications: Information you provide when you contact us.</li>
        </ul>
        <p>
            We may also automatically collect certain information when you use the Service, such as:
        </p>
         <ul className={styles.subList}>
             <li>Log Information: IP address, browser type, operating system, access times, pages viewed.</li>
             <li>Device Information: Information about the computer or mobile device you use.</li>
             <li>Information Collected by Cookies and Other Tracking Technologies: [Explain your use of cookies - essential, analytics, etc.]</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>3. How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
         <ul className={styles.subList}>
            <li>Provide, maintain, and improve the Service.</li>
            <li>Process your submissions and display User Content.</li>
            <li>Communicate with you, including responding to your comments and questions.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with the Service.</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of NewsGrid and others.</li>
             <li>[Add any other uses specific to your platform]</li>
        </ul>
      </section>

       <section className={styles.section}>
        <h2 className={styles.subtitle}>4. How We Share Your Information</h2>
        <p>
          We may share information about you as follows or as otherwise described in this Privacy Policy:
        </p>
         <ul className={styles.subList}>
            <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., hosting providers, analytics providers).</li>
            <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process.</li>
            <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of NewsGrid or others.</li>
            <li>In connection with, or during negotiations of, any merger, sale of company assets, financing or acquisition of all or a portion of our business by another company.</li>
            <li>Between and among NewsGrid and our current and future parents, affiliates, subsidiaries, and other companies under common control and ownership.</li>
            <li>With your consent or at your direction.</li>
         </ul>
         <p>We do not sell your personal information. [Ensure this statement is accurate for your practices].</p>
      </section>

       <section className={styles.section}>
        <h2 className={styles.subtitle}>5. Cookies</h2>
        <p>
          [Explain your use of cookies in detail. What types? What purpose? Link to a cookie management tool if applicable.] Example: We use cookies to help operate and analyze the Service. You can usually instruct your browser, by changing its settings, to stop accepting cookies or to prompt you before accepting a cookie from the websites you visit.
        </p>
      </section>

       <section className={styles.section}>
        <h2 className={styles.subtitle}>6. Data Security</h2>
        <p>
          We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is completely secure.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>7. Your Choices and Rights</h2>
        <p>
          Depending on your jurisdiction, you may have certain rights regarding your personal information, such as the right to access, correct, delete, or restrict its processing. [Detail these rights and how users can exercise them, e.g., through account settings or by contacting you]. You can typically update your account information through your account settings page.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>8. Changes to This Policy</h2>
        <p>
          We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>9. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at [Your Contact Email or Link to Contact Page].
        </p>
      </section>
      {/* === END OF PLACEHOLDER CONTENT === */}

    </div>
  );
}
