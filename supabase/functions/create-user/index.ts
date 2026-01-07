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

    const { email, password, fullName, username, role, groupIds } =
      await req.json()

    if (!email || !password || !fullName) {
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
    const { error: updateError } = await supabaseClient
      .from('reurb_profiles')
      .update({
        role: role || 'user',
        username: username || email, // Use email as fallback for username
        full_name: fullName,
      })
      .eq('id', userData.user.id)

    if (updateError) throw updateError

    // 3. Assign Groups
    if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
      const membershipData = groupIds.map((gid) => ({
        user_id: userData.user.id,
        group_id: gid,
      }))

      const { error: groupError } = await supabaseClient
        .from('reurb_user_group_membership')
        .insert(membershipData)

      if (groupError) {
        console.error('Failed to assign groups:', groupError)
        // Non-fatal, continue
      }
    }

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
