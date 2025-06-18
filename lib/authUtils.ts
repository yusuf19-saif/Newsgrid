import { supabaseAdmin } from './supabaseServer'; // Make sure path to supabaseServer is correct

export async function checkUserRole(userId: string, roleToCheck: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role') // Selecting something is necessary, 'role' or '*' or even 'user_id'
      .eq('user_id', userId)
      .eq('role', roleToCheck)
      .maybeSingle(); // Efficiently checks if at least one such row exists

    if (error) {
      console.error(`Error checking role '${roleToCheck}' for user ${userId}:`, error);
      return false;
    }
    // If 'data' is not null, it means a row matching both user_id and role was found.
    return data !== null; 
  } catch (err) {
    console.error(`Exception while checking role '${roleToCheck}' for user ${userId}:`, err);
    return false;
  }
}
