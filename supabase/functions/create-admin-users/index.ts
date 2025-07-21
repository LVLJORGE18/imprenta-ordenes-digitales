import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de administración con service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const users = [
      {
        email: 'joseimprenta@ortega.com',
        password: 'Ortega1.',
        username: 'jose_estacion1',
        name: 'José Estación 1',
        role: 'estación 1'
      },
      {
        email: 'David.imprenta@ortega.com',
        password: 'DOrtega1.',
        username: 'david_admin',
        name: 'David Administrador',
        role: 'Administrador'
      },
      {
        email: 'joseluisimprenta@ortega.com',
        password: 'Ortega123.',
        username: 'joseluis_estacion3',
        name: 'José Luis Estación 3',
        role: 'estación 3'
      },
      {
        email: 'marcoimprenta@ortega.com',
        password: 'Ortega1234.',
        username: 'marco_estacion4',
        name: 'Marco Estación 4',
        role: 'estación 4'
      }
    ]

    const results = []

    for (const userData of users) {
      // Crear usuario en auth.users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      })

      if (authError) {
        console.error(`Error creating user ${userData.email}:`, authError)
        results.push({ email: userData.email, error: authError.message })
        continue
      }

      if (authData.user) {
        // Crear perfil en la tabla profiles
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            username: userData.username,
            name: userData.name,
            role: userData.role
          })

        if (profileError) {
          console.error(`Error creating profile for ${userData.email}:`, profileError)
          results.push({ email: userData.email, error: profileError.message })
        } else {
          results.push({ email: userData.email, success: true, userId: authData.user.id })
        }
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})