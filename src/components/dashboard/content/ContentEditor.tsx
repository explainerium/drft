"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, ImageIcon, ImagePlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_LINKS, ADMIN_TIME_ZONE } from "@/constants/admin";
import { revalidateTags } from "@/redux/api/adminCatalogApi";
import {
  useCreatePageMutation,
  useCreatePostMutation,
  useDeletePageMutation,
  useDeletePostMutation,
  useGetAdminPageQuery,
  useGetAdminPostQuery,
  useUpdatePageMutation,
  useUpdatePostMutation,
  type AdminPage,
  type AdminPost,
} from "@/redux/api/adminContentApi";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";
import { PageHeader, QueryError } from "../AdminPage";
import { MediaPicker, thumbOf } from "../products/MediaPicker";
import { errorProps, FormField, NativeSelect } from "../products/fields";
import { RichTextEditor } from "../products/RichTextEditor";

type Kind = "post" | "page";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "2026-10-21T13:07" in the shop's time zone, for a datetime-local input. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

/** A datetime-local value read as the shop's time zone, as an ISO instant. */
const fromLocalInput = (value: string): string | null => {
  if (!value) return null;
  const asUtc = new Date(`${value}:00Z`);
  // The zone's offset at that moment, from how it formats the UTC instant.
  const shown = new Date(toLocalInput(asUtc.toISOString()) + ":00Z");
  return new Date(asUtc.getTime() - (shown.getTime() - asUtc.getTime())).toISOString();
};

/** Journal post or site page, new (no id) or existing. */
export function ContentEditor({ kind, id }: { kind: Kind; id?: string }) {
  const t = useTranslations("admin.contentEditor");
  const post = useGetAdminPostQuery(id ?? "", { skip: kind !== "post" || !id });
  const page = useGetAdminPageQuery(id ?? "", { skip: kind !== "page" || !id });
  const query = kind === "post" ? post : page;
  const back = kind === "post" ? { href: ADMIN_LINKS.journal, label: t("backJournal") } : { href: ADMIN_LINKS.pages, label: t("backPages") };

  if (query.isError) {
    return (
      <>
        <PageHeader title={t("notFoundTitle")} back={back} />
        <QueryError onRetry={query.refetch} />
      </>
    );
  }
  if (id && !query.data) {
    return (
      <div aria-hidden className="flex flex-col gap-6">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }
  return <EditorForm key={query.data?.id ?? "new"} kind={kind} item={query.data} back={back} />;
}

function EditorForm({
  kind,
  item,
  back,
}: {
  kind: Kind;
  item?: AdminPost | AdminPage;
  back: { href: string; label: string };
}) {
  const t = useTranslations("admin.contentEditor");
  const uid = useId();
  const router = useRouter();
  const [createPost, creatingPost] = useCreatePostMutation();
  const [updatePost, updatingPost] = useUpdatePostMutation();
  const [createPage, creatingPage] = useCreatePageMutation();
  const [updatePage, updatingPage] = useUpdatePageMutation();
  const saving = creatingPost.isLoading || updatingPost.isLoading || creatingPage.isLoading || updatingPage.isLoading;
  const post = kind === "post" ? (item as AdminPost | undefined) : undefined;
  const page = kind === "page" ? (item as AdminPage | undefined) : undefined;
  const [cover, setCover] = useState<{ id: string; url: string } | null>(
    post?.cover ? { id: post.cover.id, url: post.cover.sizes.thumb?.url ?? post.cover.url } : null,
  );
  const [picking, setPicking] = useState(false);

  const schema = z.object({
    title: z.string().trim().min(1, t("errors.required")).max(160, t("errors.tooLong")),
    slug: z
      .string()
      .trim()
      .max(120, t("errors.tooLong"))
      .refine((v) => (kind === "page" ? SLUG.test(v) : v === "" || SLUG.test(v)), t("errors.slug")),
    summary: z.string().trim().max(kind === "post" ? 400 : 600, t("errors.tooLong")),
    body: z.string(),
    tag: z.string().trim().max(40, t("errors.tooLong")),
    author: z.string().trim().max(80, t("errors.tooLong")),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    publishedAt: z.string(),
    metaTitle: z.string().trim().max(160, t("errors.tooLong")),
    metaDescription: z.string().trim().max(320, t("errors.tooLong")),
  });
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item?.title ?? "",
      slug: item?.slug ?? "",
      summary: post?.excerpt ?? page?.intro ?? "",
      body: item?.body ?? "",
      tag: post?.tag ?? "",
      author: post?.author ?? (kind === "post" ? "DRFT Team" : ""),
      status: item?.status ?? "DRAFT",
      publishedAt: toLocalInput(post?.publishedAt ?? null),
      metaTitle: item?.metaTitle ?? "",
      metaDescription: item?.metaDescription ?? "",
    },
  });
  const { register, handleSubmit, control, setError, reset, formState } = form;
  const { errors, isDirty } = formState;
  const title = useWatch({ control, name: "title" });
  const coverChanged = kind === "post" && (cover?.id ?? null) !== (post?.coverAssetId ?? null);
  const dirty = isDirty || coverChanged;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const onSubmit = handleSubmit(
    async (values) => {
      const orNull = (v: string) => v.trim() || null;
      try {
        let saved: AdminPost | AdminPage;
        if (kind === "post") {
          const body = {
            title: values.title,
            ...(values.slug ? { slug: values.slug } : {}),
            excerpt: orNull(values.summary),
            body: orNull(values.body),
            tag: orNull(values.tag),
            author: orNull(values.author),
            coverAssetId: cover?.id ?? null,
            status: values.status,
            publishedAt: fromLocalInput(values.publishedAt),
            metaTitle: orNull(values.metaTitle),
            metaDescription: orNull(values.metaDescription),
          };
          saved = post ? await updatePost({ id: post.id, body }).unwrap() : await createPost(body).unwrap();
          await revalidateTags(["posts", ...new Set([post?.slug, saved.slug].filter(Boolean).map((s) => `post:${s}`))]);
        } else {
          const body = {
            title: values.title,
            slug: values.slug,
            intro: orNull(values.summary),
            body: orNull(values.body),
            status: values.status,
            metaTitle: orNull(values.metaTitle),
            metaDescription: orNull(values.metaDescription),
          };
          saved = page ? await updatePage({ id: page.id, body }).unwrap() : await createPage(body).unwrap();
          await revalidateTags(["pages", ...new Set([page?.slug, saved.slug].filter(Boolean).map((s) => `page:${s}`))]);
        }
        toast.success(item ? t("saved") : t("created"));
        if (item) {
          reset(values);
        } else {
          reset();
          router.replace(kind === "post" ? ADMIN_LINKS.post(saved.id) : ADMIN_LINKS.page(saved.id));
        }
      } catch (error) {
        const fields = apiFieldErrors(error);
        for (const field of fields) {
          const path = field.path === "excerpt" || field.path === "intro" ? "summary" : field.path;
          setError(path as keyof Values, { message: field.message });
        }
        toast.error(apiErrorMessage(error) ?? t("failed"));
      }
    },
    () => toast.error(t("invalid")),
  );

  const id = (field: string) => `${uid}-${field}`;
  const publicPath = item ? (kind === "post" ? `/journal/${item.slug}` : `/${item.slug}`) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="sticky top-14 z-10 -mx-4 -mt-4 border-b bg-surface px-4 pt-4 pb-3 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 md:top-0 lg:-mx-8 lg:-mt-7 lg:px-8 lg:pt-7">
        <PageHeader
          back={back}
          title={title.trim() || (kind === "post" ? t("newPost") : t("newPage"))}
          description={publicPath ?? (kind === "post" ? t("newPostHint") : t("newPageHint"))}
          actions={
            <>
              {item?.status === "PUBLISHED" && publicPath && (
                <Button asChild variant="outline">
                  <a href={publicPath} target="_blank" rel="noopener">
                    <ExternalLinkIcon />
                    {t("view")}
                  </a>
                </Button>
              )}
              <Button type="submit" disabled={saving || (!!item && !dirty)}>
                {saving ? t("saving") : item ? t("save") : t("create")}
              </Button>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <FormField id={id("title")} label={t("fields.title")} error={errors.title?.message}>
              <Input id={id("title")} maxLength={160} {...errorProps(id("title"), errors.title?.message)} {...register("title")} />
            </FormField>
            <FormField
              id={id("summary")}
              label={kind === "post" ? t("fields.excerpt") : t("fields.intro")}
              hint={kind === "post" ? t("fields.excerptHint") : t("fields.introHint")}
              error={errors.summary?.message}
            >
              <Textarea id={id("summary")} rows={3} maxLength={kind === "post" ? 400 : 600} {...register("summary")} />
            </FormField>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t("fields.body")}</span>
              <Controller
                control={control}
                name="body"
                render={({ field }) => (
                  <RichTextEditor id={id("body")} label={t("fields.body")} value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("publishing")}</CardTitle>
              <CardDescription>{t("publishingHint")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField id={id("status")} label={t("fields.status")}>
                <NativeSelect id={id("status")} {...register("status")}>
                  <option value="DRAFT">{t("status.DRAFT")}</option>
                  <option value="PUBLISHED">{t("status.PUBLISHED")}</option>
                </NativeSelect>
              </FormField>
              <FormField
                id={id("slug")}
                label={t("fields.slug")}
                hint={kind === "post" ? t("fields.slugHintPost") : t("fields.slugHintPage")}
                error={errors.slug?.message}
              >
                <Input
                  id={id("slug")}
                  maxLength={120}
                  placeholder={kind === "post" ? t("fields.slugPlaceholder") : "about"}
                  {...errorProps(id("slug"), errors.slug?.message)}
                  {...register("slug")}
                />
              </FormField>
              {kind === "post" && (
                <>
                  <FormField id={id("date")} label={t("fields.publishedAt")} hint={t("fields.publishedAtHint")}>
                    <Input id={id("date")} type="datetime-local" {...register("publishedAt")} />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField id={id("tag")} label={t("fields.tag")} error={errors.tag?.message}>
                      <Input id={id("tag")} maxLength={40} placeholder="Destinations" {...register("tag")} />
                    </FormField>
                    <FormField id={id("author")} label={t("fields.author")} error={errors.author?.message}>
                      <Input id={id("author")} maxLength={80} {...register("author")} />
                    </FormField>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {kind === "post" && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("cover")}</CardTitle>
                <CardDescription>{t("coverHint")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
                    <ImagePlusIcon />
                    {cover ? t("changeCover") : t("chooseCover")}
                  </Button>
                  {cover && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCover(null)}>
                      <XIcon />
                      {t("removeCover")}
                    </Button>
                  )}
                </div>
              </CardContent>
              <MediaPicker
                single
                open={picking}
                onClose={() => setPicking(false)}
                exclude={cover ? [cover.id] : []}
                onPick={([asset]) => asset && setCover({ id: asset.id, url: thumbOf(asset) })}
              />
            </Card>
          )}

          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("seo")}</CardTitle>
              <CardDescription>{t("seoHint")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField id={id("meta-title")} label={t("fields.metaTitle")} error={errors.metaTitle?.message}>
                <Input id={id("meta-title")} maxLength={160} placeholder={title} {...register("metaTitle")} />
              </FormField>
              <FormField id={id("meta-description")} label={t("fields.metaDescription")} error={errors.metaDescription?.message}>
                <Textarea id={id("meta-description")} rows={3} maxLength={320} {...register("metaDescription")} />
              </FormField>
            </CardContent>
          </Card>

          {item && <DeleteContent kind={kind} item={item} />}
        </div>
      </div>
    </form>
  );
}

function DeleteContent({ kind, item }: { kind: Kind; item: AdminPost | AdminPage }) {
  const t = useTranslations("admin.contentEditor");
  const router = useRouter();
  const [removePost, removingPost] = useDeletePostMutation();
  const [removePage, removingPage] = useDeletePageMutation();
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    try {
      if (kind === "post") {
        await removePost(item.id).unwrap();
        await revalidateTags(["posts", `post:${item.slug}`]);
      } else {
        await removePage(item.id).unwrap();
        await revalidateTags(["pages", `page:${item.slug}`]);
      }
      toast.success(t("deleted", { title: item.title }));
      router.replace(kind === "post" ? ADMIN_LINKS.journal : ADMIN_LINKS.pages);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2Icon />
        {kind === "post" ? t("deletePost") : t("deletePage")}
      </Button>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmTitle", { title: item.title })}</DialogTitle>
            <DialogDescription>{kind === "post" ? t("confirmPost") : t("confirmPage")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removingPost.isLoading || removingPage.isLoading}
              onClick={confirm}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
