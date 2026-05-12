import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  if (!query?.trim()) {
    return NextResponse.json({ found: false, error: 'Busca vazia' })
  }

  const { data, error } = await supabase.rpc('lookup_customer', { p_query: query.trim() })

  if (error) {
    return NextResponse.json({ found: false, error: error.message })
  }

  return NextResponse.json(data)
}
