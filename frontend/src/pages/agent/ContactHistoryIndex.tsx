import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Check, X, User, Phone, MessageCircle, Calendar, MapPin, Search, StickyNote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { MissedContactBadge } from '@/components/shared/MissedContactBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MultiSelectFilter } from '@/components/shared/MultiSelectFilter'
import { DateRangeFilter, EMPTY_DATE_RANGE, matchesDateRange, type DateRangeValue } from '@/components/shared/DateRangeFilter'
import { PropertyDocumentLink } from '@/components/property/PropertyDocumentLink'
import {
  WORK_STATUS_FILTER_OPTIONS,
  workStatusFilterValue,
  type WorkStatusFilterValue,
} from '@/constants/WorkStatus'
import { FormTextarea } from '@/components/form/FormTextarea'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { WorkStatusSelect } from '@/components/agent/WorkStatusSelect'
import { ListingOwnerPreviewDialog } from '@/components/property/ListingOwnerPreviewDialog'
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
    <form onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)} className="flex gap-2 items-start">
      <FormTextarea control={control} name="note" label="" rows={2} placeholder={t('agent.notePlaceholder')} />
      <div className="flex flex-col gap-1 pt-1">
        <button type="submit" className="text-green-600 hover:text-green-700">
          <Check className="size-4" />
        </button>
        <button type="button" onClick={onDone} className="text-red-500 hover:text-red-600">
          <X className="size-4" />
        </button>
      </div>
    </form>
  )
}

export default function ContactHistoryIndex() {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<WorkStatusFilterValue[]>([])
  const [dateRange, setDateRange] = useState<DateRangeValue>(EMPTY_DATE_RANGE)

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: [AgentService.QUERY_KEYS.CONTACTS],
    queryFn: AgentService.getContacts,
  })

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return contacts.filter((c) => {
      if (statusFilters.length && !statusFilters.includes(workStatusFilterValue(c.workStatus))) return false
      if (!matchesDateRange(c.appointmentDate, dateRange)) return false
      if (!q) return true
      const hay = `${c.userName ?? ''} ${c.propertyTitle ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [contacts, searchQuery, statusFilters, dateRange])

  const statusOptions = WORK_STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))

  return (
    <PageContainer size="7xl">
      <PageTitle title={t('agent.visitRequestsTitle')} subtitle={t('agent.visitRequestsSubtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : contacts.length === 0 ? (
        <EmptyState title={t('agent.noHistory')} description={t('agent.noHistoryDesc')} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('agent.visitRequestsSearchPlaceholder')}
                className="pl-9"
              />
            </div>
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              className="sm:w-72"
            />
            <MultiSelectFilter
              placeholder={t('filters.workStatus')}
              selected={statusFilters}
              options={statusOptions}
              onChange={(next) => setStatusFilters(next as WorkStatusFilterValue[])}
              className="sm:w-44"
            />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {t('agent.visitRequestsCount', { count: filteredContacts.length })}
          </p>
          {filteredContacts.length === 0 ? (
            <EmptyState title={t('agent.visitRequestsNoMatches')} description={t('agent.visitRequestsNoMatchesDesc')} />
          ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => {
              const phone = contact.phone || contact.userPhone || contact.latestContact
              const isEditing = editingId === contact.id
              return (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="size-4 text-muted-foreground" />
                          <span className="font-medium">{contact.userName ?? '-'}</span>
                          <MissedContactBadge booking={contact} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="size-3.5" />
                              {phone}
                            </span>
                          )}
                          {contact.lineId && (
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="size-3.5" />
                              {contact.lineId}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {formatDateTime(contact.appointmentDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground flex-wrap">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          <span>{contact.propertyTitle ?? `#${contact.propertyId}`}</span>
                          {contact.propertyCode && (
                            <span className="ml-1 text-xs text-muted-foreground font-mono">{contact.propertyCode}</span>
                          )}
                          {contact.listingOwner && (
                            <ListingOwnerPreviewDialog preview={contact.listingOwner} />
                          )}
                          <PropertyDocumentLink url={contact.propertyDocumentUrl} />
                        </div>
                        {!isEditing && contact.note && (
                          <div className="flex items-start gap-2 pt-2 mt-2 border-t border-border text-sm">
                            <StickyNote className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-muted-foreground font-medium mr-1">{t('contacts.note')}</span>
                              <span className="text-foreground whitespace-pre-wrap">{contact.note}</span>
                            </div>
                          </div>
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
                            className="size-8"
                            title={t('agent.noteLabel')}
                            onClick={() => setEditingId(contact.id)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
