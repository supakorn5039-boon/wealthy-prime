import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Check, X, User, Phone, MessageCircle, Calendar, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormTextarea } from '@/components/form/FormTextarea'
import { WorkStatusSelect } from '@/components/agent/WorkStatusSelect'
import { agentNoteSchema, type AgentNoteSchema } from '@/dto/ReviewValidation'
import { formatDateTime } from '@/utils/date'
import type { Booking } from '@/types/Booking'

function NoteEditor({ contact, onDone }: { contact: Booking; onDone: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { control, handleSubmit } = useForm<AgentNoteSchema>({
    resolver: zodResolver(agentNoteSchema),
    defaultValues: { note: contact.note ?? '' },
  })

  const mutation = useMutation({
    mutationFn: (values: AgentNoteSchema) =>
      AgentService.updateContactNote(contact.id, values.note ?? ''),
    onSuccess: () => {
      toast.success(t('agent.noteSaved'))
      queryClient.invalidateQueries({ queryKey: [AgentService.QUERY_KEYS.CONTACTS] })
      onDone()
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex gap-2 items-start">
      <FormTextarea control={control} name="note" label="" rows={2} placeholder={t('agent.notePlaceholder')} />
      <div className="flex flex-col gap-1 pt-1">
        <button type="submit" className="text-green-600 hover:text-green-700">
          <Check className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDone} className="text-red-500 hover:text-red-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}

export default function ContactHistoryIndex() {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: [AgentService.QUERY_KEYS.CONTACTS],
    queryFn: AgentService.getContacts,
  })

  return (
    <PageContainer size="7xl">
      <PageTitle title={t('agent.visitRequestsTitle')} subtitle={t('agent.visitRequestsSubtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : contacts.length === 0 ? (
        <EmptyState title={t('agent.noHistory')} description={t('agent.noHistoryDesc')} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            {t('agent.visitRequestsCount', { count: contacts.length })}
          </p>
          <div className="space-y-3">
            {contacts.map((contact) => {
              const phone = contact.phone || contact.userPhone || contact.latestContact
              const isEditing = editingId === contact.id
              return (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contact.userName ?? '-'}</span>
                          <BookingStatusBadge status={contact.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {phone}
                            </span>
                          )}
                          {contact.lineId && (
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {contact.lineId}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateTime(contact.appointmentDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{contact.propertyTitle ?? `#${contact.propertyId}`}</span>
                          {contact.propertyCode && (
                            <span className="ml-1 text-xs text-muted-foreground font-mono">{contact.propertyCode}</span>
                          )}
                        </div>
                        {!isEditing && contact.note && (
                          <p className="text-sm text-muted-foreground pt-1 border-t border-border mt-2">
                            {contact.note}
                          </p>
                        )}
                        {isEditing && (
                          <div className="pt-2 border-t border-border mt-2">
                            <NoteEditor contact={contact} onDone={() => setEditingId(null)} />
                          </div>
                        )}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <WorkStatusSelect contact={contact} />
                        {!isEditing && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title={t('agent.noteLabel')}
                            onClick={() => setEditingId(contact.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </PageContainer>
  )
}
