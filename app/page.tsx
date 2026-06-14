import { AuthGuard } from '@/components/auth-guard'
import { ProjectsDashboard } from '@/components/projects/projects-dashboard'

export default function Page() {
  return (
    <AuthGuard>
      <ProjectsDashboard />
    </AuthGuard>
  )
}
