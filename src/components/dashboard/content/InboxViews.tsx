"use client";

import { DownloadIcon, InboxIcon, MailIcon, ReplyIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useDeleteMessageMutation,
  useDeleteSubscriberMutation,
  useGetMessagesQuery,
  useGetSubscribersQuery,
  useUpdateMessageMutation,
  type ContactMessage,
  type SubscriberStatus,
} from "@/redux/api/adminContentApi";
import { apiErrorMessage } from "@/utils/apiError";
import { PageHeader, Pagination, QueryError, useAdminFormat } from "../AdminPage";
import { SearchBox } from "../SearchBox";

const SUBSCRIBER_STATUSES: SubscriberStatus[] = ["SUBSCRIBED", "PENDING", "UNSUBSCRIBED"];

/** URL-backed filters (?status=&q=&page=) shared by both lists. */
function useListParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  return {
    get: (key: string) => searchParams.get(key),
    page: Math.max(1, Number(searchParams.get("page")) || 1),
    search: searchParams.get("q") ?? "",
    set,
  };
}

/** Newsletter subscribers: confirmed, waiting for confirmation, unsubscribed. */
export function NewsletterView() {
  const t = useTranslations("admin.newsletter");
  const f = useAdminFormat();
  const params = useListParams();
  const statusParam = params.get("status");
  const status = SUBSCRIBER_STATUSES.find((s) => s === statusParam);
  const { data, isLoading, isError, refetch } = useGetSubscribersQuery({ page: params.page, search: params.search, status });
  const [remove] = useDeleteSubscriberMutation();
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/newsletter/admin/export");
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "drft-newsletter.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={exporting}>
            <DownloadIcon />
            {t("export")}
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={t("filter")} className="flex flex-wrap gap-1.5">
          {[undefined, ...SUBSCRIBER_STATUSES].map((value) => (
            <button
              key={value ?? "all"}
              type="button"
              aria-pressed={status === value}
              onClick={() => params.set({ status: value, page: undefined })}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                status === value ? "border-abyss bg-abyss text-white" : "border-border bg-card hover:bg-accent",
              )}
            >
              {value ? t(`status.${value}`) : t("all")}
              {value && data && (
                <span className={cn("text-xs tabular-nums", status === value ? "text-white/70" : "text-muted-foreground")}>
                  {data.counts[value]}
                </span>
              )}
            </button>
          ))}
        </div>
        <SearchBox
          key={params.search}
          defaultValue={params.search}
          placeholder={t("search")}
          onSearch={(q) => params.set({ q: q || undefined, page: undefined })}
          className="sm:w-80"
        />
      </div>
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">{t("columns.email")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.source")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.since")}</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">{t("columns.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5">
                    <Skeleton className="h-32 w-full" />
                  </TableCell>
                </TableRow>
              ) : data.subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <MailIcon className="mx-auto mb-2 size-5" aria-hidden />
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data.subscribers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-72 truncate pl-5 font-medium">{s.email}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-xs font-medium",
                          s.status === "SUBSCRIBED"
                            ? "bg-success/10 text-emerald-700"
                            : s.status === "PENDING"
                              ? "bg-signal-soft text-signal"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {t(`status.${s.status}`)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{s.source ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {f.date(s.confirmedAt ?? s.createdAt)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("remove", { email: s.email })}
                        title={t("remove", { email: s.email })}
                        onClick={async () => {
                          try {
                            await remove(s.id).unwrap();
                            toast.success(t("removed", { email: s.email }));
                          } catch (error) {
                            toast.error(apiErrorMessage(error) ?? t("failed"));
                          }
                        }}
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {data && <Pagination meta={data.meta} onPage={(next) => params.set({ page: next > 1 ? String(next) : undefined })} />}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </>
  );
}

/** Contact form messages: a list and the open message beside it. */
export function MessagesView() {
  const t = useTranslations("admin.messages");
  const f = useAdminFormat();
  const params = useListParams();
  const unread = params.get("unread") === "1";
  const { data, isLoading, isError, refetch } = useGetMessagesQuery({ page: params.page, search: params.search, unread });
  const [update] = useUpdateMessageMutation();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = data?.messages.find((m) => m.id === openId) ?? null;

  const openMessage = (message: ContactMessage) => {
    setOpenId(message.id);
    if (!message.isRead) void update({ id: message.id, isRead: true });
  };

  return (
    <>
      <PageHeader title={t("title")} description={data ? t("subtitle", { count: data.unread }) : t("subtitleLoading")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={t("filter")} className="flex gap-1.5">
          {[false, true].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={unread === value}
              onClick={() => params.set({ unread: value ? "1" : undefined, page: undefined })}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                unread === value ? "border-abyss bg-abyss text-white" : "border-border bg-card hover:bg-accent",
              )}
            >
              {value ? t("unread") : t("all")}
            </button>
          ))}
        </div>
        <SearchBox
          key={params.search}
          defaultValue={params.search}
          placeholder={t("search")}
          onSearch={(q) => params.set({ q: q || undefined, page: undefined })}
          className="sm:w-80"
        />
      </div>
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading || !data ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : data.messages.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
          <InboxIcon className="size-5" aria-hidden />
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <ul className="panel divide-y overflow-hidden">
            {data.messages.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  aria-current={message.id === openId || undefined}
                  onClick={() => openMessage(message)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-5 py-3 text-left transition-colors hover:bg-accent/50",
                    message.id === openId && "bg-accent",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {!message.isRead && <span aria-label={t("new")} className="size-2 shrink-0 rounded-full bg-brand" />}
                    <span className={cn("min-w-0 flex-1 truncate text-sm", !message.isRead && "font-semibold")}>
                      {message.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{f.date(message.createdAt)}</span>
                  </span>
                  <span className="truncate text-sm">{message.subject ?? t("noSubject")}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">{message.message}</span>
                </button>
              </li>
            ))}
          </ul>
          {open ? <MessageDetail message={open} onDeleted={() => setOpenId(null)} /> : (
            <div className="panel hidden items-center justify-center py-20 text-sm text-muted-foreground lg:flex">
              {t("pick")}
            </div>
          )}
        </div>
      )}
      {data && <Pagination meta={data.meta} onPage={(next) => params.set({ page: next > 1 ? String(next) : undefined })} />}
    </>
  );
}

function MessageDetail({ message, onDeleted }: { message: ContactMessage; onDeleted: () => void }) {
  const t = useTranslations("admin.messages");
  const f = useAdminFormat();
  const [update] = useUpdateMessageMutation();
  const [remove, removing] = useDeleteMessageMutation();
  const subject = message.subject ?? t("noSubject");
  const reply = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${subject}`)}`;

  return (
    <article className="panel flex flex-col gap-4 p-5 sm:p-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">{subject}</h2>
        <p className="text-sm text-muted-foreground">
          {message.name} · {message.email}
        </p>
        <p className="text-xs text-subtle-foreground">
          {f.dateTime(message.createdAt)}
          {message.orderNumber && ` · ${t("order", { number: message.orderNumber })}`}
        </p>
      </header>
      <p className="border-t pt-4 text-sm leading-6 whitespace-pre-line">{message.message}</p>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button asChild>
          <a href={reply}>
            <ReplyIcon />
            {t("reply")}
          </a>
        </Button>
        <Button variant="outline" onClick={() => update({ id: message.id, isRead: !message.isRead })}>
          {message.isRead ? t("markUnread") : t("markRead")}
        </Button>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={removing.isLoading}
          onClick={async () => {
            try {
              await remove(message.id).unwrap();
              toast.success(t("deleted"));
              onDeleted();
            } catch (error) {
              toast.error(apiErrorMessage(error) ?? t("failed"));
            }
          }}
        >
          <Trash2Icon />
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}
