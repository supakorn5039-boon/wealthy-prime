import { useTranslation } from 'react-i18next'
import { UserCircle, Mail, Phone as PhoneIcon, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { PageTitle } from '@/components/shared/PageTitle'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AgentProfileIndex() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <PageTitle title={t('agent.profileTitle')} subtitle={`1 ${t('agent.profileCount')}`} />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-4">
              <UserCircle className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  {t(`role.${user.role}`)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
