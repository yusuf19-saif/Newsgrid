import Link from 'next/link';
import styles from './categories.module.css'; // We'll create this next

// Function to fetch categories from our API
// This function will run on the server.
async function getCategories(): Promise<string[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/categories`;
  console.log('Fetching categories from:', apiUrl);
  try {
    // Fetch data from your API route.
    // Using an absolute URL is good practice for fetch in Server Components,
    // especially if your app might be deployed to a different domain/port than the API.
    // During development, if your app and API are on the same port, /api/categories would also work.
    const res = await fetch(apiUrl, {
      cache: 'no-store', // Ensures fresh data on every request
    });

    if (!res.ok) {
      // Log the error for server-side debugging
      console.error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
      // You could throw an error here to be caught by an error.tsx boundary
      // or return an empty array to gracefully degrade.
      return [];
    }

    const categories: string[] = await res.json();
    return categories;
  } catch (error) {
    console.error('Error in getCategories:', error);
    return []; // Return empty array on error
  }
}

export default async function CategoriesPage() {
  // Fetch categories on the server
  const uniqueCategories = await getCategories();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>All Categories</h1>
      {uniqueCategories.length > 0 ? (
        <ul className={styles.list}>
          {uniqueCategories.map((category) => (
            <li key={category} className={styles.listItem}>
              <Link
                href={`/category/${encodeURIComponent(category.toLowerCase())}`}
                className={styles.link}
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noCategoriesMessage}>
          No categories found. Please check back later or try adding some articles.
        </p>
      )}
    </div>
  );
}
