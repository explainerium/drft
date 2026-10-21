"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, MoreHorizontalIcon, RefreshCwIcon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useCreateStaffMutation,
  useGetStaffQuery,
  useRemoveStaffMutation,
  useUpdateStaffMutation,
} from "@/redux/api/adminSettingsApi";
import { useSession } from "@/redux/api/authApi";
import type { StaffMember } from "@/types/adminSettings";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { PageHeader, QueryError, useAdminFormat } from "../AdminPage";
import { errorProps, FormField, NativeSelect } from "../products/fields";

const nameOf = (member: StaffMember) => `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email;

/** 14 letters and digits from the browser's crypto, for a first password the admin passes on. */
const generatePassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

/** People who can sign in to the admin: admins (everything) and staff (no store setup). */
export function StaffView() {
  const t = useTranslations("admin.staff");
  const f = useAdminFormat();
  const { user } = useSession();
  const { data, isLoading, isError, refetch } = useGetStaffQuery();
  const [adding, setAdding] = useState(false);
  const [update] = useUpdateStaffMutation();
  const [remove] = useRemoveStaffMutation();
  const [removing, setRemoving] = useState<StaffMember | null>(null);

  const change = async (member: StaffMember, body: Partial<Pick<StaffMember, "role" | "status">>, done: string) => {
    try {
      await update({ id: member.id, body }).unwrap();
      toast.success(done);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const members = [...(data ?? [])].sort((a, b) => a.role.localeCompare(b.role) || nameOf(a).localeCompare(nameOf(b)));

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlusIcon />
            {t("add")}
          </Button>
        }
      />
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">{t("columns.name")}</TableHead>
                <TableHead>{t("columns.role")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.lastLogin")}</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">{t("columns.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5">
                    <Skeleton className="h-24 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const isMe = member.id === user?.id;
                  const name = nameOf(member);
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase())
                              .join("")}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 truncate font-medium">
                              {name}
                              {isMe && <span className="text-xs font-normal text-muted-foreground">{t("you")}</span>}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-xs font-medium",
                              member.role === "ADMIN" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {t(`roles.${member.role === "ADMIN" ? "ADMIN" : "STAFF"}`)}
                          </span>
                          {member.status === "SUSPENDED" && (
                            <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                              {t("suspended")}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {member.lastLoginAt ? f.dateTime(member.lastLoginAt) : t("never")}
                      </TableCell>
                      <TableCell className="pr-5">
                        {!isMe && (
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={t("actionsFor", { name })}>
                                <MoreHorizontalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {member.role === "ADMIN" ? (
                                <DropdownMenuItem
                                  onSelect={() => change(member, { role: "STAFF" }, t("madeStaff", { name }))}
                                >
                                  {t("makeStaff")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => change(member, { role: "ADMIN" }, t("madeAdmin", { name }))}
                                >
                                  {t("makeAdmin")}
                                </DropdownMenuItem>
                              )}
                              {member.status === "ACTIVE" ? (
                                <DropdownMenuItem
                                  onSelect={() => change(member, { status: "SUSPENDED" }, t("wasSuspended", { name }))}
                                >
                                  {t("suspend")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => change(member, { status: "ACTIVE" }, t("wasReactivated", { name }))}
                                >
                                  {t("reactivate")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(member)}>
                                {t("remove")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("rolesHint")}</p>
      {adding && <AddStaffDialog onClose={() => setAdding(false)} />}
      {removing && (
        <Dialog open onOpenChange={(open) => !open && setRemoving(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("removeTitle", { name: nameOf(removing) })}</DialogTitle>
              <DialogDescription>{t("removeHint")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoving(null)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await remove(removing.id).unwrap();
                    toast.success(t("removed", { name: nameOf(removing) }));
                    setRemoving(null);
                  } catch (error) {
                    toast.error(apiErrorMessage(error) ?? t("failed"));
                  }
                }}
              >
                {t("remove")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function AddStaffDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("admin.staff");
  const uid = useId();
  const [create, state] = useCreateStaffMutation();
  const schema = z.object({
    firstName: z.string().trim().min(1, t("errors.required")).max(100),
    lastName: z.string().trim().min(1, t("errors.required")).max(100),
    email: z.email(t("errors.email")),
    role: z.enum(["STAFF", "ADMIN"]),
    password: z.string().min(8, t("errors.password")).max(72),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", role: "STAFF", password: generatePassword() },
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getValues("password"));
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create(values).unwrap();
      toast.success(t("added", { name: `${values.firstName} ${values.lastName}` }));
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      for (const field of fields) setError(field.path as keyof Values, { message: field.message });
      if (fields.length === 0) toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  });

  const id = (field: string) => `${uid}-${field}`;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("add")}</DialogTitle>
            <DialogDescription>{t("addHint")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={id("first")} label={t("fields.firstName")} error={errors.firstName?.message}>
              <Input id={id("first")} {...errorProps(id("first"), errors.firstName?.message)} {...register("firstName")} />
            </FormField>
            <FormField id={id("last")} label={t("fields.lastName")} error={errors.lastName?.message}>
              <Input id={id("last")} {...errorProps(id("last"), errors.lastName?.message)} {...register("lastName")} />
            </FormField>
          </div>
          <FormField id={id("email")} label={t("fields.email")} error={errors.email?.message}>
            <Input
              id={id("email")}
              type="email"
              autoComplete="off"
              {...errorProps(id("email"), errors.email?.message)}
              {...register("email")}
            />
          </FormField>
          <FormField id={id("role")} label={t("fields.role")} hint={t("rolesHint")}>
            <NativeSelect id={id("role")} {...register("role")}>
              <option value="STAFF">{t("roles.STAFF")}</option>
              <option value="ADMIN">{t("roles.ADMIN")}</option>
            </NativeSelect>
          </FormField>
          <FormField
            id={id("password")}
            label={t("fields.password")}
            hint={t("passwordHint")}
            error={errors.password?.message}
          >
            <div className="flex gap-1">
              <Input
                id={id("password")}
                autoComplete="new-password"
                className="font-mono"
                {...errorProps(id("password"), errors.password?.message)}
                {...register("password")}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("newPassword")}
                title={t("newPassword")}
                onClick={() => setValue("password", generatePassword(), { shouldValidate: true })}
              >
                <RefreshCwIcon />
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label={t("copy")} title={t("copy")} onClick={copy}>
                <CopyIcon />
              </Button>
            </div>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={state.isLoading}>
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
