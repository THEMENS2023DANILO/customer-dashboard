import { NextRequest, NextResponse } from 'next/server'

const CORREIOS_AUTH_URL = 'https://api.correios.com.br/token/v1/autentica/cartaopostagem'
const CORREIOS_TRACK_URL = 'https://api.correios.com.br/srorastro/v1/objetos'

let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const creds = Buffer.from(
    `${process.env.CORREIOS_USUARIO}:${process.env.CORREIOS_SENHA}`
  ).toString('base64')

  const res = await fetch(CORREIOS_AUTH_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero: process.env.CORREIOS_CARTAO }),
  })

  const data = await res.json()
  if (!data.token) throw new Error(data.msgs?.[0] ?? 'Auth failed')

  cachedToken = data.token as string
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000 // 23h (token lasts 24h)
  return cachedToken
}

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) return NextResponse.json({ error: 'Código vazio' }, { status: 400 })

  try {
    const token = await getToken()
    const res = await fetch(`${CORREIOS_TRACK_URL}/${code.trim().toUpperCase()}?resultado=T`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()
    const obj = data.objetos?.[0]

    if (!obj || obj.erro) {
      return NextResponse.json({ found: false })
    }

    const events = (obj.eventos ?? []).map((e: Record<string, unknown>) => ({
      date: e.dtHrCriado,
      description: e.descricao,
      detail: e.detalhe,
      city: (e.unidade as Record<string, unknown> | undefined)?.['endereco']
        ? `${((e.unidade as Record<string, unknown>)['endereco'] as Record<string, unknown>)['cidade'] ?? ''}${((e.unidade as Record<string, unknown>)['endereco'] as Record<string, unknown>)['uf'] ? ` / ${((e.unidade as Record<string, unknown>)['endereco'] as Record<string, unknown>)['uf']}` : ''}`
        : null,
    }))

    return NextResponse.json({ found: true, events, dtPrevista: obj.dtPrevista })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
