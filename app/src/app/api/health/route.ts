import { NextResponse } from 'next/server'

// Liveness probe used by the deploy pipeline. Deliberately does not touch the
// database: it answers "is the Node process serving requests".
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
