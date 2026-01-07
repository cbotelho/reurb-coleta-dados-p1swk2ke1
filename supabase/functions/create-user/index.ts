import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { email, password, fullName, username, role } = await req.json()

    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 1. Create User in Auth
    const { data: userData, error: createError } =
      await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      })

    if (createError) throw createError

    if (!userData.user) {
      throw new Error('User creation failed')
    }

    // 2. Update Profile in reurb_profiles
    // The trigger on_auth_user_created inserts the initial row, we update it with specific role and username
    const { error: updateError } = await supabaseClient
      .from('reurb_profiles')
      .update({
        role: role,
        username: username || email, // Use email as fallback for username
        full_name: fullName,
      })
      .eq('id', userData.user.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify(userData.user), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
