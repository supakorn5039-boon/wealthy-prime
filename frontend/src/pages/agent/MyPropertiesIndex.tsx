import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, UploadCloud, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PropertyService } from "@/services/PropertyService";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { PropertyStatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageTitle } from "@/components/shared/PageTitle";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EditPropertyDialog } from "@/components/property/EditPropertyDialog";
import { FormSelect } from "@/components/form/FormSelect";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { MultiSelectFilter } from "@/components/shared/MultiSelectFilter";
import { formatPrice } from "@/utils/date";
import {
  propertyStatusSchema,
  type PropertyStatusSchema,
} from "@/dto/PropertyValidation";
import type { Property, PropertyKind, PropertyStatus, ListingFilter } from "@/types/Property";
import { ROUTES } from "@/constants/Routes";

const STATUS_VALUES: PropertyStatus[] = ['available', 'reserved', 'sold', 'unavailable', 'owner_update']
const TYPE_VALUES: ListingFilter[] = ['sell', 'rent', 'both']
const KIND_VALUES: Exclude<PropertyKind, ''>[] = ['condo', 'house', 'townhouse']

function StatusModal({
  property,
  open,
  onClose,
}: {
  property: Property;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const statusOptions = [
    { value: "available", label: t("property.available") },
    { value: "reserved", label: t("property.reserved") },
    { value: "unavailable", label: t("property.unavailable") },
    { value: "owner_update", label: t("property.ownerUpdate") },
  ];

  const { control, handleSubmit } = useForm<PropertyStatusSchema>({
    resolver: zodResolver(propertyStatusSchema),
    defaultValues: {
      status: property.status as PropertyStatusSchema["status"],
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PropertyStatusSchema) =>
      PropertyService.updateStatus(property.id, { status: values.status }),
    onSuccess: () => {
      toast.success(t("property.requestSent"));
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.DETAIL, property.id],
      });
      onClose();
    },
    onError: () => toast.error(t("common.error")),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("property.updateStatusTitle")}: {property.projectName}
          </DialogTitle>
          <DialogDescription>
            {t("property.updateStatusDesc")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)}
          className="space-y-4"
        >
          <FormSelect
            control={control}
            name="status"
            label={t("property.newStatus")}
            options={statusOptions}
            required
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? t("property.sending")
                : t("property.sendRequest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MyPropertiesIndex() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [statusFilters, setStatusFilters] = useState<PropertyStatus[]>([]);
  const [typeFilters, setTypeFilters] = useState<ListingFilter[]>([]);
  const [kindFilters, setKindFilters] = useState<Exclude<PropertyKind, ''>[]>([]);
  const [projectFilter, setProjectFilter] = useState('');

  const baseKey = isAdmin ? 'admin-properties' : PropertyService.QUERY_KEYS.AGENT_LIST;

  const { data: properties = [], isLoading } = useQuery({
    queryKey: [baseKey, { statusFilters, typeFilters, kindFilters, projectFilter }],
    queryFn: () => {
      const params = {
        statuses: statusFilters.length ? statusFilters : undefined,
        types: typeFilters.length ? typeFilters : undefined,
        kinds: kindFilters.length ? kindFilters : undefined,
        projectName: projectFilter || undefined,
      };
      return isAdmin
        ? PropertyService.getAdminProperties(params)
        : PropertyService.getAgentProperties(params);
    },
  });
  const hasFilters = !!(statusFilters.length || typeFilters.length || kindFilters.length || projectFilter);
  const clearFilters = () => {
    setStatusFilters([]);
    setTypeFilters([]);
    setKindFilters([]);
    setProjectFilter('');
  };

  const statusOptions = useMemo(() => STATUS_VALUES.map((s) => ({ value: s, label: t(`property.status.${s}`) })), [t]);
  const typeOptions = useMemo(() => TYPE_VALUES.map((v) => ({ value: v, label: t(`property.listing.${v}`) })), [t]);
  const kindOptions = useMemo(() => KIND_VALUES.map((v) => ({ value: v, label: t(`property.kind.${v}`) })), [t]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => PropertyService.delete(id),
    onSuccess: () => {
      toast.success(t("common.deleted"));
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyService.QUERY_KEYS.LIST],
      });
      setDeleteTarget(null);
    },
    onError: () => toast.error(t("common.error")),
  });

  return (
    <PageContainer size="8xl">
      <PageTitle
        title={t("property.myPropertiesTitle")}
        actions={
          !isAdmin && (
            <Link to={ROUTES.AGENT_ADD_PROPERTY}>
              <Button>
                <Plus className="size-4 mr-2" />
                {t("property.addProperty")}
              </Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <MultiSelectFilter
          placeholder={t('property.statusCol')}
          selected={statusFilters}
          options={statusOptions}
          onChange={(next) => setStatusFilters(next as PropertyStatus[])}
        />
        <MultiSelectFilter
          placeholder={t('property.typeCol')}
          selected={typeFilters}
          options={typeOptions}
          onChange={(next) => setTypeFilters(next as ListingFilter[])}
        />
        <MultiSelectFilter
          placeholder={t('property.kindLabel')}
          selected={kindFilters}
          options={kindOptions}
          onChange={(next) => setKindFilters(next as Exclude<PropertyKind, ''>[])}
        />
        <div className="flex items-center gap-1">
          <Input
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder={t('property.projectName')}
            className="h-9"
          />
          {hasFilters && (
            <Button type="button" variant="ghost" size="icon" onClick={clearFilters} aria-label="clear">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text={t("common.loading")} />
      ) : properties.length === 0 ? (
        <EmptyState
          title={t("property.noProperties")}
          actions={
            !isAdmin && !hasFilters && (
              <Link to={ROUTES.AGENT_ADD_PROPERTY}>
                <Button>
                  <Plus className="size-4 mr-2" />
                  {t("property.addProperty")}
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("property.code")}</TableHead>
                  <TableHead>{t("property.project")}</TableHead>
                  <TableHead>{t("property.typeCol")}</TableHead>
                  <TableHead>{t("property.district")}</TableHead>
                  <TableHead>{t("property.price")}</TableHead>
                  <TableHead>{t("property.statusCol")}</TableHead>
                  <TableHead className="text-right">
                    {t("property.management")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {p.propertyCode ?? "-"}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{p.projectName}</p>
                    </TableCell>
                    <TableCell>{t(`property.${p.type}`)}</TableCell>
                    <TableCell className="text-sm">
                      {p.district || "-"}
                    </TableCell>
                    <TableCell>
                      {formatPrice(p.price)}
                      {p.type === "rent" && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          / {t("property.perMonth")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PropertyStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/property/${p.id}`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t("common.view")}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t("common.edit")}
                          onClick={() => setEditTarget(p)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t("property.updateStatus")}
                          onClick={() => setSelectedProperty(p)}
                        >
                          <UploadCloud className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title={t("common.delete")}
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedProperty && (
        <StatusModal
          property={selectedProperty}
          open={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {editTarget && (
        <EditPropertyDialog
          property={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("property.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("property.deleteConfirm", {
                title: deleteTarget?.projectName ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending
                ? t("common.deleting")
                : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
