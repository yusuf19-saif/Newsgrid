"use server"; // This directive must be at the very top of the file

import { redirect } from 'next/navigation';
// Ensure this path is correct for your project structure
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';

export async function handleSignOut() {
  const supabaseServerClient = createSupabaseServerComponentClient(); // Handles cookies internally
  
  await supabaseServerClient.auth.signOut();
  
  // After sign out, onAuthStateChange on the client should update the UI.
  // Redirecting here is also an option if immediate navigation is desired.
  return redirect('/login'); 
}