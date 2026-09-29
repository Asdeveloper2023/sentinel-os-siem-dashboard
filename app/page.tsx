import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SiemDashboard from '@/components/siem-dashboard'
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return <SiemDashboard user={{ name: session.user.name || session.user.email.split('@')[0] || 'Analyst', email: session.user.email }} />
}
