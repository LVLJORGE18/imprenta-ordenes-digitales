import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Creating vinil production user...')

    // Create the user in auth.users
    const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'vinilproduccion@ortega.com',
      password: 'VinilOrtega1.',
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User created:', user)

    // Create profile for the user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: user.user!.id,
        username: 'vinil_produccion',
        name: 'Producción de Vinil',
        role: 'estación 1'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Vinil production user profile created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario de producción de vinil creado exitosamente',
        user: user.user,
        credentials: {
          email: 'vinilproduccion@ortega.com',
          password: 'VinilOrtega1.'
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})