import { createSupabaseServerComponentClient } from "@/lib/supabaseServerComponentClient";
import SubmitArticleClient from "./SubmitArticleClient"; // We will create this next
import { Database } from "@/types/supabase";

export type Category = Database['public']['Tables']['categories']['Row'];

async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.from('categories').select('*');
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
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
