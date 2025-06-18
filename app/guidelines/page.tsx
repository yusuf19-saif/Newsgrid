import styles from './guidelines.module.css'; // We'll create this next

export default function GuidelinesPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>NewsGrid Submission Guidelines</h1>

      <section className={styles.section}>
        <p>
          Welcome to NewsGrid! We rely on contributions from people like you to build an open,
          fact-based news source. To maintain the quality and integrity of our platform,
          please adhere to the following guidelines when submitting an article.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Core Principles for Submissions</h2>
        <ul className={styles.list}>
          <li>
            <strong>Factuality is Paramount:</strong> Articles must report on events or information that are verifiable and presented as objectively as possible. Cite sources where applicable. Avoid speculation presented as fact.
          </li>
          <li>
            <strong>Relevance Matters:</strong> Submissions should cover topics of public interest, such as political events, local news, technological developments, community issues, etc.
          </li>
           <li>
            <strong>Strictly News - No Opinions:</strong> This platform is for reporting events, not expressing personal views, beliefs, or analyses. Avoid persuasive language, editorials, blog posts, or storytelling narratives.
          </li>
           <li>
            <strong>Originality & Sourcing:</strong> While reporting on existing news is okay, ideally provide new information or a direct account. If reporting based on other sources, attribute them clearly. Plagiarism is strictly prohibited.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>What We Encourage</h2>
         <ul className={styles.list}>
          <li>Direct, first-hand accounts of events (e.g., eyewitness reports of protests, local meetings).</li>
          <li>Factual summaries of official announcements, reports, or data releases.</li>
          <li>Clear reporting on local events or issues not covered by mainstream media.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>What to Avoid (Grounds for Rejection)</h2>
         <ul className={styles.list}>
          <li>**Opinions & Editorials:** Any content expressing personal viewpoints, analysis, or advocacy.</li>
          <li>**Personal Stories & Blogs:** Content focused on individual experiences rather than external events.</li>
          <li>**Promotional Content:** Articles promoting products, services, or businesses.</li>
          <li>**Misinformation & Disinformation:** Knowingly submitting false or misleading information.</li>
          <li>**Hate Speech & Harassment:** Content that attacks or demeans individuals or groups.</li>
          <li>**Illegal Content:** Reports detailing illegal acts without clear public interest justification, or content violating laws.</li>
         </ul>
      </section>

      {/* Optional: Add sections on formatting, review process, or FAQs */}
      {/*
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Formatting & Clarity</h2>
        <p>...</p>
      </section>

       <section className={styles.section}>
        <h2 className={styles.subtitle}>Review Process</h2>
        <p>...</p>
      </section>

       <section className={styles.section}>
        <h2 className={styles.subtitle}>Frequently Asked Questions (FAQ)</h2>
        <ul className={styles.list}>
           <li><strong>Q: Can I submit anonymously?</strong> A: Yes... (Explain policy)</li>
           <li><strong>Q: How long does review take?</strong> A: ...</li>
        </ul>
       </section>
       */}

      <section className={styles.section}>
         <p>
           By submitting an article to NewsGrid, you agree to these guidelines. We reserve the right
           to reject any submission that does not meet these standards. Thank you for contributing!
        </p>
      </section>
    </div>
  );
}
