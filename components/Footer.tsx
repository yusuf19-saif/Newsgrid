import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.footerNav}>
          <Link href="/about" className={styles.footerLink}>About Us</Link>
          <Link href="/contact" className={styles.footerLink}>Contact</Link>
          <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
          <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          <Link href="/guidelines" className={styles.footerLink}>Submission Guidelines</Link>
        </nav>
        <div className={styles.copyright}>
          © {new Date().getFullYear()} NewsGrid. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
