import { createSupabaseServerComponentClient } from "@/lib/supabaseServerComponentClient";
import SubmitArticleClient from "./SubmitArticleClient"; // We will create this next
import { Database } from "@/types/supabase";

// This tells Next.js to treat this page as a dynamic page,
// which ensures it runs on every request.
export const revalidate = 0;

// The type needs to change to match the function's return value
export type Category = { category: string };

async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseServerComponentClient();
  // Call the RPC function instead of querying a table
  const { data, error } = await supabase.rpc('get_distinct_categories');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  // The function returns objects like { category: 'Technology' }
  // which already matches our new Category type.
  return data || [];
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
