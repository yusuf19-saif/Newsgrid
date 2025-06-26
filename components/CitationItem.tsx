'use client';

import { useState, useEffect } from 'react';
import styles from './CitationItem.module.css';

type CitationItemProps = {
  url: string;
};

type CitationData = {
  title: string;
  hostname: string;
};

const CitationItem = ({ url }: CitationItemProps) => {
  const [data, setData] = useState<CitationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const response = await fetch('/api/get-page-title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch title');
        }

        const citationData: CitationData = await response.json();
        setData(citationData);
      } catch (err) {
        try {
            const hostname = new URL(url).hostname;
            setData({ title: url, hostname });
        } catch {
            setError('Invalid URL');
            setData({ title: url, hostname: 'invalid.url'});
        }
      }
    };

    fetchTitle();
  }, [url]);

  if (error) {
    return <li className={styles.citationItem}>Error: {error}</li>;
  }

  if (!data) {
    return (
      <li className={styles.citationItem}>
        <div className={styles.loader}></div>
        <span className={styles.hostname}>{new URL(url).hostname.replace('www.','')}</span>
      </li>
    );
  }

  return (
    <li className={styles.citationItem}>
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
        {data.title}
      </a>
      <span className={styles.hostname}>{data.hostname}</span>
    </li>
  );
};

export default CitationItem;
