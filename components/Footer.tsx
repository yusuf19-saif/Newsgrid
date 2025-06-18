import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link href="/about">About Us</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/guidelines">Submission Guidelines</Link>
      </div>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} NewsGrid. All rights reserved.
      </div>
    </footer>
  );
}
