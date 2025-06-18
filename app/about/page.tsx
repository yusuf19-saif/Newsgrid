import styles from './about.module.css'; // We'll create this next

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>About NewsGrid</h1>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Our Mission: Real News, Real People</h2>
        <p>
          NewsGrid is a public news platform built on the principle that anyone should be able to
          report factual, serious, and relevant news. In an era saturated with opinions, noise,
          and platform manipulation, we aim to provide a clear channel for public-driven journalism.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>What NewsGrid Is</h2>
        <ul className={styles.list}>
          <li>
            <strong>Open Publishing:</strong> Anyone can report the news — whether it's about global politics, local events, community protests, or technological breakthroughs. We believe important stories can come from anywhere.
          </li>
          <li>
            <strong>Strictly News:</strong> Every article must report verifiable facts and events, not personal opinions, narratives, or promotional content. Think objective reporting, not blogging.
          </li>
           <li>
            <strong>A Public Utility:</strong> We strive to be a neutral platform, a tool for accessing raw, factual information reported by diverse voices, both verified and unverified.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>What NewsGrid Is Not</h2>
         <ul className={styles.list}>
          <li>
            <strong>A Social Network:</strong> You won't find likes, follower counts, memes, or viral trends here. The focus is solely on the news content itself.
          </li>
          <li>
            <strong>An Opinion Forum:</strong> This is not a place for editorials, think pieces, blogs, or Medium-style essays. We value factual reporting above all else.
          </li>
          <li>
            <strong>Pay-to-Play:</strong> Writers cannot pay to boost their articles or gain visibility. NewsGrid remains neutral, ensuring a fair platform for all factual reports.
          </li>
        </ul>
      </section>

       <section className={styles.section}>
        <h2 className={styles.subtitle}>Core Principles</h2>
         <ul className={styles.list}>
           <li>✅ **Open Access:** Enabling broad participation in reporting.</li>
           <li>🎯 **Factual Accuracy:** Prioritizing verifiable information over opinion.</li>
           <li>🧹 **No Noise:** Filtering out social metrics and subjective content.</li>
           <li>⚖️ **Neutrality:** Maintaining a fair and unbiased platform.</li>
         </ul>
      </section>

      <section className={styles.section}>
        <p>
          Join us in building a more direct, transparent, and public-driven news ecosystem.
        </p>
      </section>
    </div>
  );
}
