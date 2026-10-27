"use client";

import { ArrowUpIcon, ChevronDownIcon, ImageIcon, ImagePlusIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { get, useFieldArray, useFormContext, useFormState, useWatch, type FieldPath } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker, thumbOf } from "./MediaPicker";
import { errorProps, FormField } from "./fields";
import { FEATURE_LIMIT, STORY_LIMITS } from "./productContentForm";
import type { ProductFormValues } from "./productForm";

type Path = FieldPath<ProductFormValues>;

/** The product page's editorial blocks: intro, rider story, key features and what is in the box. */
export function ProductContentSection() {
  const t = useTranslations("admin.product.content");
  const content = useWatch<ProductFormValues, "content">({ name: "content" });
  const { errors } = useFormState<ProductFormValues>({ name: "content" });
  const hasError = (block: string) => !!get(errors, `content.${block}`);

  const story = content.story;
  const features = content.features;
  const used = {
    intro: !!(content.profile || content.highlightTitle || content.highlightBody),
    story: !!(story.eyebrow || story.title || story.paragraphs.length),
    features: !!(features.eyebrow || features.title || features.items.length),
    box: !!content.inTheBox.trim(),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Block title={t("intro.title")} hint={t("intro.hint")} used={used.intro} invalid={hasError("highlightTitle") || hasError("highlightBody") || hasError("profile")}>
          <IntroFields />
        </Block>
        <Block title={t("story.title")} hint={t("story.hint")} used={used.story} invalid={hasError("story")}>
          <StoryFields />
        </Block>
        <Block title={t("features.title")} hint={t("features.hint")} used={used.features} invalid={hasError("features")}>
          <FeatureFields />
        </Block>
        <Block title={t("box.title")} hint={t("box.hint")} used={used.box} invalid={hasError("inTheBox")}>
          <BoxField />
        </Block>
      </CardContent>
    </Card>
  );
}

/** A collapsible block. It opens by itself when it holds an error, so a failed save shows why. */
function Block({
  title,
  hint,
  used,
  invalid,
  children,
}: {
  title: string;
  hint: string;
  used: boolean;
  invalid: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("admin.product.content");
  const [open, setOpen] = useState(false);
  const id = useId();
  const expanded = open || invalid;

  return (
    <section className="rounded-xl border">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setOpen(!expanded)}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left outline-none hover:bg-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
        <span className={invalid ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>
          {invalid ? t("needsAttention") : used ? t("inUse") : t("empty")}
        </span>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {expanded && (
        <div id={id} className="flex flex-col gap-4 border-t px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}

/** Input bound to a form path, with its label and error. */
function TextField({
  name,
  label,
  hint,
  max,
  multiline = false,
}: {
  name: Path;
  label: string;
  hint?: string;
  max: number;
  multiline?: boolean;
}) {
  const { register } = useFormContext<ProductFormValues>();
  const { errors } = useFormState<ProductFormValues>({ name });
  const error = get(errors, name)?.message as string | undefined;
  const id = `${useId()}-${name}`;
  return (
    <FormField id={id} label={label} hint={hint} error={error}>
      {multiline ? (
        <Textarea id={id} rows={3} maxLength={max} {...errorProps(id, error)} {...register(name)} />
      ) : (
        <Input id={id} maxLength={max} {...errorProps(id, error)} {...register(name)} />
      )}
    </FormField>
  );
}

function IntroFields() {
  const t = useTranslations("admin.product.content.intro");
  return (
    <>
      <TextField name="content.profile" label={t("profile")} hint={t("profileHint")} max={60} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="content.highlightTitle" label={t("highlightTitle")} hint={t("highlightHint")} max={120} />
        <TextField name="content.highlightBody" label={t("highlightBody")} max={400} multiline />
      </div>
    </>
  );
}

function StoryFields() {
  const t = useTranslations("admin.product.content.story");
  const { control, register, setValue } = useFormContext<ProductFormValues>();
  const { errors } = useFormState({ control, name: "content.story" });
  const paragraphs = useFieldArray({ control, name: "content.story.paragraphs", keyName: "key" });
  const stats = useFieldArray({ control, name: "content.story.stats", keyName: "key" });
  const [imageAssetId, imageUrl] = useWatch({ control, name: ["content.story.imageAssetId", "content.story.imageUrl"] });
  const [picking, setPicking] = useState(false);
  const storyErrors = errors.content?.story;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="content.story.eyebrow" label={t("eyebrow")} hint={t("eyebrowHint")} max={80} />
        <TextField name="content.story.title" label={t("heading")} max={160} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">{t("paragraphs")}</legend>
        {paragraphs.fields.map((paragraph, index) => (
          <div key={paragraph.key} className="flex gap-2">
            <Textarea
              aria-label={t("paragraph", { number: index + 1 })}
              rows={3}
              maxLength={1200}
              {...register(`content.story.paragraphs.${index}.text`)}
            />
            <RowButtons
              onUp={index > 0 ? () => paragraphs.swap(index, index - 1) : undefined}
              onRemove={() => paragraphs.remove(index)}
            />
          </div>
        ))}
        {storyErrors?.paragraphs?.message && (
          <p className="text-xs font-medium text-destructive">{storyErrors.paragraphs.message}</p>
        )}
        <AddButton
          disabled={paragraphs.fields.length >= STORY_LIMITS.paragraphs}
          onClick={() => paragraphs.append({ text: "" })}
          label={t("addParagraph")}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">{t("stats")}</legend>
        {stats.fields.map((stat, index) => {
          const rowError = storyErrors?.stats?.[index];
          return (
            <div key={stat.key} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] gap-2">
              <Input
                aria-label={t("statValue")}
                placeholder={t("statValue")}
                maxLength={16}
                {...errorProps(`stat-${index}-value`, rowError?.value?.message)}
                {...register(`content.story.stats.${index}.value`)}
              />
              <Input
                aria-label={t("statLabel")}
                placeholder={t("statLabel")}
                maxLength={60}
                {...errorProps(`stat-${index}-label`, rowError?.label?.message)}
                {...register(`content.story.stats.${index}.label`)}
              />
              <RowButtons onRemove={() => stats.remove(index)} />
            </div>
          );
        })}
        <AddButton
          disabled={stats.fields.length >= STORY_LIMITS.stats}
          onClick={() => stats.append({ value: "", label: "" })}
          label={t("addStat")}
        />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="content.story.quoteText" label={t("quote")} max={300} multiline />
        <div className="flex flex-col gap-4">
          <TextField name="content.story.quoteAuthor" label={t("quoteAuthor")} max={120} />
          <TextField name="content.story.quoteLabel" label={t("quoteLabel")} hint={t("quoteLabelHint")} max={80} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("image")}</span>
        <div className="flex items-center gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
            {imageAssetId && imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
              <ImagePlusIcon />
              {imageAssetId ? t("changeImage") : t("chooseImage")}
            </Button>
            {imageAssetId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue("content.story.imageAssetId", "", { shouldDirty: true });
                  setValue("content.story.imageUrl", "");
                }}
              >
                <XIcon />
                {t("removeImage")}
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
      </div>
      <MediaPicker
        open={picking}
        single
        exclude={imageAssetId ? [imageAssetId] : []}
        onClose={() => setPicking(false)}
        onPick={([asset]) => {
          if (!asset) return;
          setValue("content.story.imageAssetId", asset.id, { shouldDirty: true });
          setValue("content.story.imageUrl", thumbOf(asset));
        }}
      />
    </>
  );
}

function FeatureFields() {
  const t = useTranslations("admin.product.content.features");
  const { control, register } = useFormContext<ProductFormValues>();
  const { errors } = useFormState({ control, name: "content.features" });
  const items = useFieldArray({ control, name: "content.features.items", keyName: "key" });
  const featureErrors = errors.content?.features;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="content.features.eyebrow" label={t("eyebrow")} hint={t("eyebrowHint")} max={80} />
        <TextField name="content.features.title" label={t("heading")} max={160} />
      </div>
      <TextField name="content.features.intro" label={t("intro")} max={400} multiline />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 text-sm font-medium">{t("items")}</legend>
        {items.fields.map((item, index) => {
          const rowError = featureErrors?.items?.[index];
          return (
            <div key={item.key} className="flex flex-col gap-2 rounded-lg bg-secondary/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{t("item", { number: index + 1 })}</span>
                <RowButtons
                  onUp={index > 0 ? () => items.swap(index, index - 1) : undefined}
                  onRemove={() => items.remove(index)}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  aria-label={t("label")}
                  placeholder={t("label")}
                  maxLength={60}
                  {...errorProps(`feature-${index}-label`, rowError?.label?.message)}
                  {...register(`content.features.items.${index}.label`)}
                />
                <Input
                  aria-label={t("itemTitle")}
                  placeholder={t("itemTitle")}
                  maxLength={80}
                  {...errorProps(`feature-${index}-title`, rowError?.title?.message)}
                  {...register(`content.features.items.${index}.title`)}
                />
              </div>
              <Textarea
                aria-label={t("body")}
                placeholder={t("body")}
                rows={2}
                maxLength={500}
                {...errorProps(`feature-${index}-body`, rowError?.body?.message)}
                {...register(`content.features.items.${index}.body`)}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  aria-label={t("footnote")}
                  placeholder={t("footnote")}
                  maxLength={60}
                  {...register(`content.features.items.${index}.footnote`)}
                />
                <Input
                  aria-label={t("footnoteValue")}
                  placeholder={t("footnoteValue")}
                  maxLength={60}
                  {...register(`content.features.items.${index}.footnoteValue`)}
                />
              </div>
              {(rowError?.label || rowError?.title || rowError?.body) && (
                <p className="text-xs font-medium text-destructive">{t("itemRequired")}</p>
              )}
            </div>
          );
        })}
        {featureErrors?.items?.message && (
          <p className="text-xs font-medium text-destructive">{featureErrors.items.message}</p>
        )}
        <AddButton
          disabled={items.fields.length >= FEATURE_LIMIT}
          onClick={() => items.append({ label: "", title: "", body: "", footnote: "", footnoteValue: "" })}
          label={t("add")}
        />
      </fieldset>
    </>
  );
}

function BoxField() {
  const t = useTranslations("admin.product.content.box");
  return <TextField name="content.inTheBox" label={t("items")} hint={t("itemsHint")} max={2000} multiline />;
}

function RowButtons({ onUp, onRemove }: { onUp?: () => void; onRemove: () => void }) {
  const t = useTranslations("admin.product.content");
  return (
    <div className="flex shrink-0 gap-0.5">
      {onUp && (
        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("moveUp")} onClick={onUp}>
          <ArrowUpIcon />
        </Button>
      )}
      <Button type="button" variant="ghost" size="icon-sm" aria-label={t("remove")} onClick={onRemove}>
        <Trash2Icon />
      </Button>
    </div>
  );
}

function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" className="self-start" disabled={disabled} onClick={onClick}>
      <PlusIcon />
      {label}
    </Button>
  );
}
