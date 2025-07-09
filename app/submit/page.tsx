import { createSupabaseServerComponentClient } from "@/lib/supabaseServerComponentClient";
import SubmitArticleClient from "./SubmitArticleClient"; // We will create this next
import { Database } from "@/types/supabase";

// This tells Next.js to treat this page as a dynamic page,
// which ensures it runs on every request.
export const revalidate = 0;

// The type needs to change to match the function's return value
export type Category = { category: string };

// We'll now use a static list of categories instead of fetching from the database.
const fixedCategories: Category[] = [
  { category: 'Business' },
  { category: 'Global' },
  { category: 'Local' },
  { category: 'Politics' },
  { category: 'Technology' },
  { category: 'World' },
  { category: 'Uncategorized' },
  { category: 'Other' },
  { category: 'Environment' },
  { category: 'Health' },
  { category: 'Science' },
  { category: 'Education' },
  { category: 'Crime' },
  { category: 'Opinion' },
  { category: 'Economy' },
  { category: 'Culture' },
  { category: 'Sports' },
  { category: 'Entertainment' },
  { category: 'Religion' },
  { category: 'Editorial' }
];

async function getCategories(): Promise<Category[]> {
  // Sort the categories alphabetically for a better user experience.
  return fixedCategories.sort((a, b) => a.category.localeCompare(b.category));
}

const SubmitPage = async () => {
  const categories = await getCategories();

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <SubmitArticleClient categories={categories} />
    </div>
  );
};

export default SubmitPage;
