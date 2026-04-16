"use client";

import { type MediaStatus, type MediaType, type NewsStatus } from "@prisma/client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Film, ImageIcon, Newspaper, PencilLine, PlayCircle, Plus, RotateCcw, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { ResponsiveVideoEmbed } from "@/components/media/responsive-video-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertNewsAction } from "@/features/news/server/actions";
import { initialNewsActionState } from "@/features/news/server/action-state";
import { formatShortDate } from "@/lib/format-date";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";

type NewsListItem = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  content: string | null;
  status: NewsStatus;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  stateId: string | null;
  stateName: string | null;
  cityId: string | null;
  cityName: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  commentsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  tagIds: string[];
  tagNames: string[];
  featuredMediaId: string | null;
  featuredMediaUrl: string | null;
  mediaIds: string[];
};

type OptionItem = {
  id: string;
  name: string;
  isActive?: boolean;
};

type CityOption = {
  id: string;
  name: string;
  stateId: string;
  isActive: boolean;
};

type MediaOption = {
  id: string;
  type: MediaType;
  url: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  status: MediaStatus;
  altText: string | null;
  caption: string | null;
};

type NewsAdminPanelProps = {
  newsItems: NewsListItem[];
  categories: OptionItem[];
  authors: OptionItem[];
  states: OptionItem[];
  cities: CityOption[];
  tags: OptionItem[];
  mediaItems: MediaOption[];
};

const statusOptions: Array<{ value: NewsStatus; label: string }> = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "PENDING_REVIEW", label: "Em revisao" },
  { value: "APPROVED", label: "Aprovada" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "PUBLISHED", label: "Publicada" },
  { value: "REJECTED", label: "Rejeitada" },
  { value: "ARCHIVED", label: "Arquivada" }
];

const statusLabels: Record<NewsStatus, string> = {
  DRAFT: "Rascunho",
  DRAFT_AI: "Rascunho IA",
  PENDING_REVIEW: "Em revisao",
  APPROVED: "Aprovada",
  SCHEDULED: "Agendada",
  PUBLISHED: "Publicada",
  REJECTED: "Rejeitada",
  ARCHIVED: "Arquivada"
};

const mediaStatusLabels: Record<MediaStatus, string> = {
  PENDING_REVIEW: "Em revisao",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada"
};

const emptyForm = {
  id: "",
  title: "",
  subtitle: "",
  slug: "",
  summary: "",
  content: "",
  status: "DRAFT" as NewsStatus,
  categoryId: "",
  authorId: "",
  stateId: "",
  cityId: "",
  seoTitle: "",
  seoDescription: "",
  commentsEnabled: false,
  tagIds: [] as string[],
  featuredMediaId: "",
  mediaIds: [] as string[]
};

function statusBadgeVariant(status: NewsStatus) {
  if (status === "PUBLISHED") return "accent";
  if (status === "APPROVED" || status === "SCHEDULED") return "default";
  if (status === "REJECTED" || status === "ARCHIVED") return "secondary";
  return "outline";
}

function mediaStatusBadgeVariant(status: MediaStatus) {
  if (status === "APPROVED") return "accent";
  if (status === "REJECTED") return "secondary";
  return "outline";
}

function mediaTypeLabel(type: MediaType) {
  return type === "VIDEO" ? "Video embedado" : "Imagem";
}

function MediaOptionPreview({ media, title }: { media: MediaOption; title: string }) {
  if (media.type === "VIDEO" && media.embedUrl) {
    return <ResponsiveVideoEmbed embedUrl={media.embedUrl} title={title} className="rounded-none border-none" />;
  }

  const previewUrl = media.thumbnailUrl ?? media.url;

  if (!previewUrl) {
    return (
      <div className="flex h-36 items-center justify-center bg-background/50 text-muted-foreground">
        <Film className="size-5" />
      </div>
    );
  }

  return <img src={previewUrl} alt={title} className="h-36 w-full object-cover" />;
}

export function NewsAdminPanel({
  newsItems,
  categories,
  authors,
  states,
  cities,
  tags,
  mediaItems
}: NewsAdminPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState(upsertNewsAction, initialNewsActionState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [isSlugDirty, setIsSlugDirty] = useState(false);

  const editingNews = useMemo(() => newsItems.find((item) => item.id === editingId) ?? null, [newsItems, editingId]);
  const visibleCities = useMemo(
    () => cities.filter((city) => !formValues.stateId || city.stateId === formValues.stateId),
    [cities, formValues.stateId]
  );
  const availableGalleryMedia = useMemo(() => {
    if (!formValues.featuredMediaId) {
      return formValues.mediaIds;
    }

    return formValues.mediaIds.includes(formValues.featuredMediaId)
      ? formValues.mediaIds
      : [formValues.featuredMediaId, ...formValues.mediaIds];
  }, [formValues.featuredMediaId, formValues.mediaIds]);

  const selectedFeaturedMedia = useMemo(
    () => mediaItems.find((media) => media.id === formValues.featuredMediaId) ?? null,
    [formValues.featuredMediaId, mediaItems]
  );

  useEffect(() => {
    if (editingNews) {
      setFormValues({
        id: editingNews.id,
        title: editingNews.title,
        subtitle: editingNews.subtitle ?? "",
        slug: editingNews.slug,
        summary: editingNews.summary ?? "",
        content: editingNews.content ?? "",
        status: editingNews.status,
        categoryId: editingNews.categoryId,
        authorId: editingNews.authorId,
        stateId: editingNews.stateId ?? "",
        cityId: editingNews.cityId ?? "",
        seoTitle: editingNews.seoTitle ?? "",
        seoDescription: editingNews.seoDescription ?? "",
        commentsEnabled: editingNews.commentsEnabled,
        tagIds: editingNews.tagIds,
        featuredMediaId: editingNews.featuredMediaId ?? "",
        mediaIds: editingNews.mediaIds
      });
      setIsSlugDirty(true);
      return;
    }

    setFormValues(emptyForm);
    setIsSlugDirty(false);
  }, [editingNews]);

  useEffect(() => {
    if (state.status === "success") {
      const currentStatus = searchParams.get("status");
      const currentCategory = searchParams.get("categoryId");
      const nextParams = new URLSearchParams();

      if (currentStatus) nextParams.set("status", currentStatus);
      if (currentCategory) nextParams.set("categoryId", currentCategory);

      setEditingId(null);
      setFormValues(emptyForm);
      setIsSlugDirty(false);
      router.refresh();

      const query = nextParams.toString();
      router.replace(query ? `/admin/news?${query}` : "/admin/news");
    }
  }, [router, searchParams, state.status]);

  function handleFieldChange(field: keyof typeof formValues, value: string | boolean) {
    setFormValues((current) => {
      const next = {
        ...current,
        [field]: value
      };

      if (field === "title" && !isSlugDirty && typeof value === "string") {
        next.slug = slugify(value);
      }

      if (field === "stateId" && typeof value === "string") {
        const currentCityStillValid = current.cityId && cities.some((city) => city.id === current.cityId && city.stateId === value);
        next.cityId = currentCityStillValid ? current.cityId : "";
      }

      if (field === "cityId" && typeof value === "string") {
        const selectedCity = cities.find((city) => city.id === value);
        next.stateId = selectedCity?.stateId ?? current.stateId;
      }

      if (field === "featuredMediaId" && typeof value === "string") {
        next.featuredMediaId = value;

        if (!value) {
          return next;
        }

        next.mediaIds = current.mediaIds.includes(value) ? current.mediaIds : [value, ...current.mediaIds];
      }

      return next;
    });
  }

  function toggleTag(tagId: string) {
    setFormValues((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...current.tagIds, tagId]
    }));
  }

  function toggleMedia(mediaId: string) {
    setFormValues((current) => {
      const isSelected = current.mediaIds.includes(mediaId);
      const nextMediaIds = isSelected
        ? current.mediaIds.filter((currentMediaId) => currentMediaId !== mediaId)
        : [...current.mediaIds, mediaId];

      return {
        ...current,
        mediaIds: nextMediaIds,
        featuredMediaId: current.featuredMediaId === mediaId && isSelected ? "" : current.featuredMediaId
      };
    });
  }

  function resetForm() {
    setEditingId(null);
    setFormValues(emptyForm);
    setIsSlugDirty(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_28rem]">
      <div className="space-y-4">
        {newsItems.map((news) => (
          <Card key={news.id} className="border-border/70 bg-card/90">
            <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{news.title}</h3>
                  <Badge variant={statusBadgeVariant(news.status)}>{statusLabels[news.status]}</Badge>
                  <Badge variant="outline">{news.slug}</Badge>
                </div>
                {news.subtitle ? <p className="text-sm text-muted-foreground">{news.subtitle}</p> : null}
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <div className="grid gap-1">
                    <p>Categoria: {news.categoryName}</p>
                    <p>Autor: {news.authorName}</p>
                    <p>Localizacao: {news.cityName ? `${news.cityName}, ${news.stateName}` : news.stateName ?? "Nao definida"}</p>
                  </div>
                  <div className="grid gap-1">
                    <p>Comentarios: {news.commentsEnabled ? "Ativos" : "Desativados"}</p>
                    <p>Tags: {news.tagNames.length > 0 ? news.tagNames.join(", ") : "Sem tags"}</p>
                    <p>Atualizada em: {formatShortDate(news.updatedAt)}</p>
                  </div>
                </div>
                {news.summary ? <p className="text-sm leading-6 text-muted-foreground">{news.summary}</p> : null}
              </div>
              <div className="grid gap-3 lg:justify-items-end">
                {news.featuredMediaUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80">
                    <img src={news.featuredMediaUrl} alt={news.title} className="h-28 w-44 object-cover" />
                  </div>
                ) : (
                  <div className="flex h-28 w-44 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/50 text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
                <Button type="button" variant="outline" className="gap-2" onClick={() => setEditingId(news.id)}>
                  <PencilLine className="size-4" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit border-border/70 bg-card/95">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{editingNews ? "Editar noticia" : "Nova noticia"}</CardTitle>
              <CardDescription>
                Formulario editorial com taxonomia, SEO, destaque principal e galeria apoiada em `MediaFile`.
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={resetForm}>
              <Plus className="size-4" />
            </Button>
          </div>
          {state.message ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                state.status === "success"
                  ? "border-primary/20 bg-primary/10 text-foreground"
                  : "border-destructive/20 bg-destructive/10 text-destructive"
              )}
            >
              {state.status === "success" ? <CheckCircle2 className="mr-2 inline size-4" /> : null}
              {state.message}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="id" value={formValues.id} />
            {formValues.tagIds.map((tagId) => (
              <input key={tagId} type="hidden" name="tagIds" value={tagId} />
            ))}
            {availableGalleryMedia.map((mediaId) => (
              <input key={mediaId} type="hidden" name="mediaIds" value={mediaId} />
            ))}

            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" name="title" value={formValues.title} onChange={(event) => handleFieldChange("title", event.target.value)} required />
              {state.fieldErrors?.title ? <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitulo</Label>
              <Input id="subtitle" name="subtitle" value={formValues.subtitle} onChange={(event) => handleFieldChange("subtitle", event.target.value)} />
              {state.fieldErrors?.subtitle ? <p className="text-xs text-destructive">{state.fieldErrors.subtitle[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formValues.slug}
                onChange={(event) => {
                  setIsSlugDirty(true);
                  handleFieldChange("slug", slugify(event.target.value));
                }}
              />
              {state.fieldErrors?.slug ? <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Resumo</Label>
              <Textarea id="summary" name="summary" value={formValues.summary} onChange={(event) => handleFieldChange("summary", event.target.value)} />
              {state.fieldErrors?.summary ? <p className="text-xs text-destructive">{state.fieldErrors.summary[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteudo</Label>
              <Textarea
                id="content"
                name="content"
                value={formValues.content}
                onChange={(event) => handleFieldChange("content", event.target.value)}
                className="min-h-48"
              />
              {state.fieldErrors?.content ? <p className="text-xs text-destructive">{state.fieldErrors.content[0]}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formValues.status}
                  onChange={(event) => handleFieldChange("status", event.target.value as NewsStatus)}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.status ? <p className="text-xs text-destructive">{state.fieldErrors.status[0]}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formValues.categoryId}
                  onChange={(event) => handleFieldChange("categoryId", event.target.value)}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Selecione</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.isActive === false ? " (inativa)" : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.categoryId ? <p className="text-xs text-destructive">{state.fieldErrors.categoryId[0]}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorId">Autor</Label>
                <select
                  id="authorId"
                  name="authorId"
                  value={formValues.authorId}
                  onChange={(event) => handleFieldChange("authorId", event.target.value)}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Selecione</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                      {author.isActive === false ? " (inativo)" : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.authorId ? <p className="text-xs text-destructive">{state.fieldErrors.authorId[0]}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateId">Estado</Label>
                <select
                  id="stateId"
                  name="stateId"
                  value={formValues.stateId}
                  onChange={(event) => handleFieldChange("stateId", event.target.value)}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Sem estado</option>
                  {states.map((stateItem) => (
                    <option key={stateItem.id} value={stateItem.id}>
                      {stateItem.name}
                      {stateItem.isActive === false ? " (inativo)" : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.stateId ? <p className="text-xs text-destructive">{state.fieldErrors.stateId[0]}</p> : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cityId">Cidade</Label>
                <select
                  id="cityId"
                  name="cityId"
                  value={formValues.cityId}
                  onChange={(event) => handleFieldChange("cityId", event.target.value)}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Sem cidade</option>
                  {visibleCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                      {city.isActive === false ? " (inativa)" : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.cityId ? <p className="text-xs text-destructive">{state.fieldErrors.cityId[0]}</p> : null}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Tags</Label>
                <p className="text-xs text-muted-foreground">Selecione as tags editoriais associadas a noticia.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={formValues.tagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="size-4 rounded border-border"
                    />
                    <span>
                      {tag.name}
                      {tag.isActive === false ? " (inativa)" : ""}
                    </span>
                  </label>
                ))}
              </div>
              {state.fieldErrors?.tagIds ? <p className="text-xs text-destructive">{state.fieldErrors.tagIds[0]}</p> : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
              <div>
                <Label htmlFor="featuredMediaId">Midia principal</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione a midia principal da materia. Pode ser imagem de capa ou video embedado aprovado.
                </p>
              </div>
              <select
                id="featuredMediaId"
                name="featuredMediaId"
                value={formValues.featuredMediaId}
                onChange={(event) => handleFieldChange("featuredMediaId", event.target.value)}
                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">Sem midia principal</option>
                {mediaItems.map((media, index) => (
                  <option key={media.id} value={media.id}>
                    {media.caption?.trim() || media.altText?.trim() || `${mediaTypeLabel(media.type)} ${index + 1}`} - {mediaStatusLabels[media.status]}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.featuredMediaId ? <p className="text-xs text-destructive">{state.fieldErrors.featuredMediaId[0]}</p> : null}

              {selectedFeaturedMedia ? (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                  <MediaOptionPreview
                    media={selectedFeaturedMedia}
                    title={selectedFeaturedMedia.altText ?? selectedFeaturedMedia.caption ?? formValues.title ?? "Midia principal"}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
              <div>
                <Label>Midias associadas</Label>
                <p className="text-xs text-muted-foreground">
                  Anexe mais de uma imagem ou video a materia. A midia principal tambem entra na relacao via `NewsMedia`.
                </p>
              </div>
              {mediaItems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {mediaItems.map((media) => {
                    const isSelected = availableGalleryMedia.includes(media.id);
                    const isFeatured = formValues.featuredMediaId === media.id;

                    return (
                      <label
                        key={media.id}
                        className={cn(
                          "overflow-hidden rounded-2xl border transition-colors",
                          isSelected ? "border-primary/50 bg-primary/5" : "border-border/70 bg-card/80"
                        )}
                      >
                        <div className="relative overflow-hidden">
                          <MediaOptionPreview media={media} title={media.altText ?? media.caption ?? "Midia editorial"} />
                          <div className="absolute left-3 top-3 flex gap-2">
                            <Badge variant={mediaStatusBadgeVariant(media.status)}>{mediaStatusLabels[media.status]}</Badge>
                            <Badge variant="outline" className="border-white/20 bg-black/40 text-white">
                              {media.type === "VIDEO" ? <PlayCircle className="mr-1 size-3" /> : <ImageIcon className="mr-1 size-3" />}
                              {mediaTypeLabel(media.type)}
                            </Badge>
                            {isFeatured ? (
                              <Badge variant="default" className="gap-1">
                                <Star className="size-3" />
                                Principal
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMedia(media.id)}
                              className="mt-1 size-4 rounded border-border"
                            />
                            <div className="space-y-1 text-sm">
                              <p className="font-medium text-foreground">
                                {media.caption?.trim() || media.altText?.trim() || `${mediaTypeLabel(media.type)} sem metadados`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {media.type === "VIDEO"
                                  ? "Video embedado pronto para uso responsivo na materia."
                                  : media.altText ?? "Adicione alt text na biblioteca para melhorar acessibilidade."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-background/50 px-4 py-5 text-sm text-muted-foreground">
                  Nenhuma midia disponivel ainda. Cadastre imagens ou videos em `/admin/media` antes de montar a materia.
                </div>
              )}
              {state.fieldErrors?.mediaIds ? <p className="text-xs text-destructive">{state.fieldErrors.mediaIds[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" name="seoTitle" value={formValues.seoTitle} onChange={(event) => handleFieldChange("seoTitle", event.target.value)} />
              {state.fieldErrors?.seoTitle ? <p className="text-xs text-destructive">{state.fieldErrors.seoTitle[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                value={formValues.seoDescription}
                onChange={(event) => handleFieldChange("seoDescription", event.target.value)}
              />
              {state.fieldErrors?.seoDescription ? <p className="text-xs text-destructive">{state.fieldErrors.seoDescription[0]}</p> : null}
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
              <input
                type="checkbox"
                name="commentsEnabled"
                checked={formValues.commentsEnabled}
                onChange={(event) => handleFieldChange("commentsEnabled", event.target.checked)}
                className="size-4 rounded border-border"
              />
              Permitir comentarios nesta noticia
            </label>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gap-2">
                {editingNews ? <PencilLine className="size-4" /> : <Newspaper className="size-4" />}
                {editingNews ? "Salvar alteracoes" : "Criar noticia"}
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={resetForm}>
                <RotateCcw className="size-4" />
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
