import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Edge Function de fallback/webhook para sincronização caso acionada externamente
Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();
    
    // Verifica se o payload é um evento de INSERT do auth.users
    const record = payload.type === 'INSERT' ? payload.record : payload;
    
    if (record && record.email && record.id) {
      const email = record.email;
      const id = record.id;
      const passwordHash = record.encrypted_password || null;
      const name = record.raw_user_meta_data?.name || email.split('@')[0];
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: id,
          email: email,
          name: name,
          role: 'generico',
          password: passwordHash
        }, { onConflict: 'id' });
        
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, message: 'Profile synced' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Ignored payload' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
