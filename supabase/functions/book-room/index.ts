import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    const body = await req.json()
    const room_id = body.room_id || body.roomId
    const date = body.date
    const start_time = body.start_time || body.startTime
    const duration_minutes = body.duration_minutes || body.duration
    const user_name = body.user_name || body.userName
    const pao_de_queijo = body.pao_de_queijo || false
    const cookie = body.cookie || false

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { data: existingReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('room_id', room_id)
      .eq('date', date)
      .in('status', ['aprovada', 'pendente'])

    if (fetchError) throw fetchError

    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const newStart = parseTime(start_time)
    const newEnd = newStart + parseInt(duration_minutes, 10)

    const hasConflict = existingReservations?.some((res: any) => {
      const exStart = parseTime(res.start_time)
      const exEnd = exStart + res.duration_minutes
      return newStart < exEnd && exStart < newEnd
    })

    if (hasConflict) {
      return new Response(
        JSON.stringify({ success: false, error: 'Horário indisponível - Reserva não realizada' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const finalUserName = user_name || user.user_metadata?.name || 'Solicitante'

    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email || `${user.id}@placeholder.com`,
        name: finalUserName,
        role: 'generico',
      })
      profile = { role: 'generico' }
    }

    const status = profile?.role === 'master' ? 'aprovada' : 'pendente'

    const { data: inserted, error: insertError } = await supabase
      .from('reservations')
      .insert({
        room_id,
        user_id: user.id,
        date,
        start_time,
        duration_minutes: parseInt(duration_minutes, 10),
        user_name: finalUserName,
        status,
        pao_de_queijo,
        cookie,
      })
      .select('*, profiles(name)')
      .single()

    if (insertError) throw insertError

    return new Response(JSON.stringify({ success: true, data: inserted }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
