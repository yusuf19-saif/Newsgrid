// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@^2.49.0';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { article_id } = await req.json();
    if (!article_id) {
      return new Response(JSON.stringify({ error: 'Missing article_id' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`AI Verification Function: Received request for article_id: ${article_id}`);

    // Create a Supabase client WITH THE SERVICE ROLE KEY to update the database
    // Ensure these environment variables are set in your Edge Function settings
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // TODO: Fetch article details (content, sources) from Supabase using article_id

    // Simulate AI Processing (Replace with actual AI API call)
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay
    const aiDeemsItFactual = Math.random() > 0.3; // 70% chance AI says it's factual (for testing)
    // const aiErrorOccurred = Math.random() > 0.9; // 10% chance of AI error (for testing)

    let newStatus = '';
    // if (aiErrorOccurred) {
    //   newStatus = 'AI Error - Needs Attention';
    // } else 
    if (aiDeemsItFactual) {
      newStatus = 'Published';
      console.log(`AI Verification for ${article_id}: Verified as Factual. Setting status to Published.`);
    } else {
      newStatus = 'Rejected - AI';
      console.log(`AI Verification for ${article_id}: Not verified. Setting status to Rejected - AI.`);
    }

    const { error: updateError } = await supabaseAdmin
      .from('articles')
      .update({ status: newStatus })
      .eq('id', article_id);

    if (updateError) {
      console.error(`AI Verification for ${article_id}: Error updating status:`, updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ message: `AI verification for ${article_id} processed. New status: ${newStatus}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Verification Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-verify-article' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
