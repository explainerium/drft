"use client";

import { ArrowDownIcon, ArrowUpIcon, CircleHelpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { revalidateTags } from "@/redux/api/adminCatalogApi";
import {
  useCreateFaqMutation,
  useDeleteFaqMutation,
  useGetAdminFaqQuery,
  useUpdateFaqMutation,
  type FaqItem,
} from "@/redux/api/adminContentApi";
import { apiErrorMessage } from "@/utils/apiError";
import { PageHeader, QueryError } from "../AdminPage";
import { Checkbox, FormField } from "../products/fields";
import { RichTextEditor } from "../products/RichTextEditor";

const refreshStore = () => revalidateTags(["faq"]);

/** FAQ questions in the order the page shows them; groups are a label on each question. */
export function FaqView() {
  const t = useTranslations("admin.faq");
  const { data, isLoading, isError, refetch } = useGetAdminFaqQuery();
  const [update] = useUpdateFaqMutation();
  const [editing, setEditing] = useState<FaqItem | "new" | null>(null);
  const groups = [...new Set((data ?? []).map((item) => item.group).filter((g): g is string => !!g))];

  // Swapping sortOrder with the neighbour; equal orders are spread out first.
  const move = async (index: number, delta: -1 | 1) => {
    if (!data) return;
    const a = data[index];
    const b = data[index + delta];
    if (!a || !b) return;
    try {
      const [orderA, orderB] = a.sortOrder === b.sortOrder ? [index + delta, index] : [b.sortOrder, a.sortOrder];
      await Promise.all([
        update({ id: a.id, body: { sortOrder: orderA } }).unwrap(),
        update({ id: b.id, body: { sortOrder: orderB } }).unwrap(),
      ]);
      await refreshStore();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon />
            {t("new")}
          </Button>
        }
      />
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading || !data ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : data.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
          <CircleHelpIcon className="size-5" aria-hidden />
          {t("empty")}
        </div>
      ) : (
        <ol className="panel divide-y overflow-hidden">
          {data.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("moveUp")}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("moveDown")}
                  disabled={index === data.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownIcon />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
              >
                <span className={cn("text-sm font-medium hover:underline", !item.isPublished && "text-muted-foreground")}>
                  {item.question}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {item.group && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{item.group}</span>
                  )}
                  {!item.isPublished && (
                    <span className="rounded-md bg-signal-soft px-1.5 py-0.5 text-xs text-signal">{t("hidden")}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {editing && (
        <FaqDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? undefined : editing}
          groups={groups}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function FaqDialog({ item, groups, onClose }: { item?: FaqItem; groups: string[]; onClose: () => void }) {
  const t = useTranslations("admin.faq");
  const uid = useId();
  const [create, creating] = useCreateFaqMutation();
  const [update, updating] = useUpdateFaqMutation();
  const [remove, removing] = useDeleteFaqMutation();
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");
  const [group, setGroup] = useState(item?.group ?? "");
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const save = async () => {
    setError(null);
    if (!question.trim()) return setError(t("errors.question"));
    if (!answer.replace(/<[^>]*>/g, "").trim()) return setError(t("errors.answer"));
    const body = { question: question.trim(), answer, group: group.trim() || null, isPublished };
    try {
      if (item) await update({ id: item.id, body }).unwrap();
      else await create(body).unwrap();
      await refreshStore();
      toast.success(t("saved"));
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err) ?? t("failed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? t("edit") : t("new")}</DialogTitle>
          <DialogDescription>{t("dialogHint")}</DialogDescription>
        </DialogHeader>
        <FormField id={`${uid}-question`} label={t("fields.question")}>
          <Input id={`${uid}-question`} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("fields.answer")}</span>
          <RichTextEditor id={`${uid}-answer`} label={t("fields.answer")} value={answer} onChange={setAnswer} />
        </div>
        <FormField id={`${uid}-group`} label={t("fields.group")} hint={t("fields.groupHint")}>
          <Input
            id={`${uid}-group`}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            maxLength={80}
            list={`${uid}-groups`}
            placeholder="Orders & shipping"
          />
          <datalist id={`${uid}-groups`}>
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </FormField>
        <Checkbox label={t("fields.published")} checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="sm:justify-between">
          {item ? (
            confirming ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={removing.isLoading}
                  onClick={async () => {
                    try {
                      await remove(item.id).unwrap();
                      await refreshStore();
                      toast.success(t("deleted"));
                      onClose();
                    } catch (err) {
                      setError(apiErrorMessage(err) ?? t("failed"));
                    }
                  }}
                >
                  {t("confirmDelete")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                  {t("keep")}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                <Trash2Icon />
                {t("delete")}
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={creating.isLoading || updating.isLoading}>
              {t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
