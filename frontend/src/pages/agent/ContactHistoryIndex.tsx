import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FormTextarea } from '@/components/form/FormTextarea'
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
    <PageContainer size="5xl">
      <PageTitle title={t('agent.visitRequestsTitle')} subtitle={t('agent.visitRequestsSubtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : contacts.length === 0 ? (
        <EmptyState title={t('agent.noHistory')} description={t('agent.noHistoryDesc')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('agent.customerCol')}</TableHead>
                  <TableHead>{t('agent.propertyCol')}</TableHead>
                  <TableHead>{t('agent.appointmentDate')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('agent.noteLabel')}</TableHead>
                  <TableHead className="text-right">{t('common.edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contact.userName ?? '-'}</p>
                        <p className="text-xs text-gray-400">{contact.userPhone ?? ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>{contact.propertyTitle ?? `#${contact.propertyId}`}</TableCell>
                    <TableCell>{formatDateTime(contact.appointmentDate)}</TableCell>
                    <TableCell><BookingStatusBadge status={contact.status} /></TableCell>
                    <TableCell className="max-w-[200px]">
                      {editingId === contact.id ? (
                        <NoteEditor contact={contact} onDone={() => setEditingId(null)} />
                      ) : (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {contact.note ?? <span className="text-gray-300">-</span>}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId !== contact.id && (
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(contact.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
