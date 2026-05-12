'use client'

import { useState, useRef } from 'react'

type Product = { name: string; quantity: number }
type Order = {
  external_id: string; number: string; date: string
  total: number; status: string; payment_status: string
  products: Product[]
}
type Prescription = {
  date: string; status: number; signed: boolean
  products: string | null; text: string
}
type Invoice = {
  source: string; numero: string; date: string
  value: string; status: string; tracking: string | null
  danfe: string | null; order_id: string | null
}
type Customer = { name: string; cpf: string; email: string; phone: string }
type Result = {
  found: boolean; error?: string
  customer?: Customer
  orders?: Order[]
  prescriptions?: Prescription[]
  invoices?: Invoice[]
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}
function fmtMoney(v: number | string) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
function fmtPhone(p: string) {
  const d = p.replace(/\D/g, '').replace(/^55/, '')
  return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

function orderStatusBadge(status: string, payment: string) {
  const s = status?.toLowerCase()
  const p = payment?.toLowerCase()
  if (s === 'cancelled') return <span className="px-2 py-0.5 rounded-full text-xs bg-red-900 text-red-300">Cancelado</span>
  if (p === 'paid') return <span className="px-2 py-0.5 rounded-full text-xs bg-green-900 text-green-300">Pago</span>
  if (p === 'pending') return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900 text-yellow-300">Aguardando Pgto</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300">{status}</span>
}

function prescriptionStatusBadge(status: number) {
  if (status === 2) return <span className="px-2 py-0.5 rounded-full text-xs bg-green-900 text-green-300">Válida</span>
  if (status === 3) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-900 text-red-300">Expirada</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300">Status {status}</span>
}

function invoiceStatusBadge(source: string, status: string) {
  if (source === 'tiny') {
    if (status === '7') return <span className="px-2 py-0.5 rounded-full text-xs bg-green-900 text-green-300">DANFE Emitida</span>
    if (status === '6') return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-900 text-blue-300">Autorizada</span>
    return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300">Status {status}</span>
  }
  if (status?.toLowerCase() === 'pendente') return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900 text-yellow-300">Pendente</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-green-900 text-green-300">{status}</span>
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      setResult(await res.json())
    } catch {
      setResult({ found: false, error: 'Erro de conexão' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-white">Dashboard The Mens</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="flex gap-2 mb-8">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="CPF, e-mail ou telefone..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold px-6 rounded-xl transition-colors"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>

        {result && !result.found && (
          <div className="bg-red-950 border border-red-800 rounded-2xl p-6 text-center">
            <p className="text-xl font-bold text-red-400">Cliente não encontrado</p>
            {result.error && <p className="text-yellow-400 text-xs mt-2 font-mono">{result.error}</p>}
          </div>
        )}

        {result?.found && result.customer && (
          <div className="flex flex-col gap-6">

            {/* Customer Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Cliente</p>
              <p className="text-2xl font-bold text-white mb-3">{result.customer.name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-400">
                <span>CPF: <span className="text-white">{fmtCPF(result.customer.cpf)}</span></span>
                <span>Email: <span className="text-white">{result.customer.email}</span></span>
                <span>Tel: <span className="text-white">{fmtPhone(result.customer.phone)}</span></span>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                Pedidos ({result.orders?.length ?? 0})
              </p>
              {result.orders?.length === 0 && <p className="text-gray-500 text-sm">Nenhum pedido encontrado</p>}
              <div className="flex flex-col gap-3">
                {result.orders?.map((o, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-400 text-sm">#{o.number}</span>
                        <span className="text-gray-500 text-sm">{fmt(o.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{fmtMoney(o.total)}</span>
                        {orderStatusBadge(o.status, o.payment_status)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {o.products?.map((p, j) => (
                        <span key={j} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">
                          {p.quantity > 1 ? `${p.quantity}x ` : ''}{p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescriptions */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                Prescrições ({result.prescriptions?.length ?? 0})
              </p>
              {result.prescriptions?.length === 0 && <p className="text-gray-500 text-sm">Nenhuma prescrição encontrada</p>}
              <div className="flex flex-col gap-3">
                {result.prescriptions?.map((p, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <span className="text-gray-400 text-sm">{fmt(p.date)}</span>
                      <div className="flex gap-2 items-center">
                        {p.signed && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-900 text-blue-300">Assinada</span>}
                        {prescriptionStatusBadge(p.status)}
                      </div>
                    </div>
                    {p.text && (
                      <p className="text-gray-400 text-xs font-mono whitespace-pre-line leading-5 mt-2 line-clamp-4">
                        {p.text.trim()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invoices */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">
                Notas Fiscais ({result.invoices?.length ?? 0})
              </p>
              {result.invoices?.length === 0 && <p className="text-gray-500 text-sm">Nenhuma NF encontrada</p>}
              <div className="flex flex-col gap-3">
                {result.invoices?.map((inv, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-400 text-sm">
                          {inv.numero ? `NF ${inv.numero}` : 'NF —'}
                        </span>
                        {inv.date && <span className="text-gray-500 text-sm">{fmt(inv.date)}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.value && <span className="font-bold text-white">{fmtMoney(inv.value)}</span>}
                        {invoiceStatusBadge(inv.source, inv.status)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {inv.tracking
                        ? <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-lg font-mono">📦 {inv.tracking}</span>
                        : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-1 rounded-lg">Sem rastreio</span>
                      }
                      {inv.order_id && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-lg">Pedido #{inv.order_id}</span>
                      )}
                      {inv.danfe && (
                        <a href={inv.danfe} target="_blank" rel="noopener noreferrer"
                          className="text-xs bg-gray-700 text-blue-400 px-2 py-1 rounded-lg hover:bg-gray-600">
                          Ver DANFE
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
