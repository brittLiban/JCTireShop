import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SessionProvider } from './session-provider'
import AdminNav from './admin-nav'

export const metadata = {
  title: 'Admin Panel | JC Tire Shop',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-10 max-w-7xl">{children}</div>
        </main>
      </div>
    </SessionProvider>
  )
}
