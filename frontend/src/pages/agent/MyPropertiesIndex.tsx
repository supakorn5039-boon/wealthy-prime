import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PropertyService } from "@/services/PropertyService";
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
import { FormInput } from "@/components/form/FormInput";
import { formatPrice } from "@/utils/date";
import {
  propertyStatusSchema,
  type PropertyStatusSchema,
} from "@/dto/PropertyValidation";
import type { Property } from "@/types/Property";
import { ROUTES } from "@/constants/Routes";

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
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const statusOptions = [
    { value: "pending_approve", label: t("property.pendingApprove") },
    { value: "available", label: t("property.available") },
  ];

  const { control, handleSubmit, watch } = useForm<PropertyStatusSchema>({
    resolver: zodResolver(propertyStatusSchema),
    defaultValues: {
      status: property.status as PropertyStatusSchema["status"],
      rentalPeriodMonths: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PropertyStatusSchema) =>
      PropertyService.updateStatus(property.id, {
        status: values.status,
        slipFile: slipFile ?? undefined,
        rentalPeriodMonths: values.rentalPeriodMonths
          ? Number(values.rentalPeriodMonths)
          : undefined,
      }),
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

  const status = watch("status");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("property.updateStatusTitle")}: {property.title}
          </DialogTitle>
          <DialogDescription>
            {t("property.updateStatusDesc")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <FormSelect
            control={control}
            name="status"
            label={t("property.newStatus")}
            options={statusOptions}
            required
          />
          {property.type === "rent" && status === "pending_approve" && (
            <FormInput
              control={control}
              name="rentalPeriodMonths"
              label={t("property.rentalPeriod")}
              type="number"
              placeholder="6"
              min={1}
              step={1}
            />
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {t("property.slip")} <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST],
    queryFn: PropertyService.getAgentProperties,
  });

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
          <Link to={ROUTES.AGENT_ADD_PROPERTY}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("property.addProperty")}
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <LoadingSpinner text={t("common.loading")} />
      ) : properties.length === 0 ? (
        <EmptyState
          title={t("property.noProperties")}
          actions={
            <Link to={ROUTES.AGENT_ADD_PROPERTY}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("property.addProperty")}
              </Button>
            </Link>
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
                    <TableCell className="font-mono text-sm text-gray-600">
                      {p.propertyCode ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.projectName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{t(`property.${p.type}`)}</TableCell>
                    <TableCell className="text-sm">
                      {p.district || "-"}
                    </TableCell>
                    <TableCell>
                      {formatPrice(p.price)}
                      {p.type === "rent" && (
                        <span className="ml-1 text-xs text-gray-400">
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
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t("common.edit")}
                          onClick={() => setEditTarget(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t("property.updateStatus")}
                          onClick={() => setSelectedProperty(p)}
                        >
                          <UploadCloud className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title={t("common.delete")}
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="h-4 w-4" />
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
                title: deleteTarget?.title ?? "",
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
