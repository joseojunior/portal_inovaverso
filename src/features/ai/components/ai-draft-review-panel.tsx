"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FileUp, Sparkles, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { convertAIDraftToNewsAction, updateAIDraftReviewAction } from "@/features/ai/server/actions";
import { initialAIDraftReviewActionState } from "@/features/ai/server/action-state";
import { formatDateTime } from "@/lib/format-date";
import { slugify } from "@/lib/slugify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type OptionItem = {
  id: string;
  name: string;
  isActive?: boolean;
};

type CityOption = OptionItem & {
  stateId: string;
};

type DraftMediaSuggestion = {
  id: string;
  externalUrl: string | null;
  reason: string | null;
  confidenceScore: string | null;
  sortOrder: number;
  isSelected: boolean;
  mediaFileId: string | null;
  mediaCaption: string | null;
  mediaUrl: string | null;
};

type DraftPayload = {
  id: string;
  status: "GENERATED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
  suggestedTitle: string;
  suggestedSubtitle: string | null;
  suggestedSlug: string | null;
  suggestedSummary: string | null;
  suggestedContent: string;
  suggestedSeoTitle: string | null;
  suggestedSeoDescription: string | null;
  suggestedTagNames: string[];
  sourceUrls: string[];
  confidenceScore: string | null;
  reviewNotes: string | null;
  generatedAt: string;
  reviewedAt: string | null;
  categoryId: string | null;
  categoryName: string | null;
  authorId: string | null;
  authorName: string | null;
  stateId: string | null;
  stateName: string | null;
  cityId: string | null;
  cityName: string | null;
  newsId: string | null;
  linkedNewsTitle: string | null;
  aiJobId: string | null;
  aiJobStatus: string | null;
  mediaSuggestions: DraftMediaSuggestion[];
};

type AIDraftReviewPanelProps = {
  draft: DraftPayload;
  categories: OptionItem[];
  authors: OptionItem[];
  states: OptionItem[];
  cities: CityOption[];
  tags: OptionItem[];
};

export function AIDraftReviewPanel({ draft, categories, authors, states, cities, tags }: AIDraftReviewPanelProps) {
  const router = useRouter();
  const [reviewState, reviewAction] = useActionState(updateAIDraftReviewAction, initialAIDraftReviewActionState);
  const [convertState, convertAction] = useActionState(convertAIDraftToNewsAction, initialAIDraftReviewActionState);
  const [isSlugDirty, setIsSlugDirty] = useState(Boolean(draft.suggestedSlug));
  const [selectedMediaSuggestionIds, setSelectedMediaSuggestionIds] = useState<string[]>(() =>
    draft.mediaSuggestions
      .filter((suggestion) => suggestion.isSelected || suggestion.mediaUrl || suggestion.externalUrl)
      .slice(0, 3)
      .map((suggestion) => suggestion.id)
  );
  const [formValues, setFormValues] = useState({
    title: draft.suggestedTitle,
    subtitle: draft.suggestedSubtitle ?? "",
    slug: draft.suggestedSlug ?? slugify(draft.suggestedTitle),
    summary: draft.suggestedSummary ?? "",
    content: draft.suggestedContent,
    categoryId: draft.categoryId ?? "",
    authorId: draft.authorId ?? "",
    stateId: draft.stateId ?? "",
    cityId: draft.cityId ?? "",
    seoTitle: draft.suggestedSeoTitle ?? "",
    seoDescription: draft.suggestedSeoDescription ?? "",
    reviewNotes: draft.reviewNotes ?? "",
    commentsEnabled: false,
    tagIds: tags
      .filter((tag) => draft.suggestedTagNames.map((name) => slugify(name)).includes(slugify(tag.name)))
      .map((tag) => tag.id)
  });

  const visibleCities = useMemo(
    () => cities.filter((city) => !formValues.stateId || city.stateId === formValues.stateId),
    [cities, formValues.stateId]
  );

  useEffect(() => {
    if (reviewState.status === "success" || convertState.status === "success") {
      router.refresh();
    }
  }, [convertState.status, reviewState.status, router]);

  function handleFieldChange(field: keyof typeof formValues, value: string | boolean) {
    setFormValues((current) => {
      const next = { ...current, [field]: value };

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

  function toggleMediaSuggestion(suggestionId: string) {
    setSelectedMediaSuggestionIds((current) =>
      current.includes(suggestionId) ? current.filter((id) => id !== suggestionId) : [...current, suggestionId]
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="space-y-6">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={draft.status === "APPROVED" ? "accent" : draft.status === "REJECTED" || draft.status === "ARCHIVED" ? "secondary" : "outline"}>
                {draft.status}
              </Badge>
              {draft.confidenceScore ? <Badge variant="outline">Confianca {draft.confidenceScore}</Badge> : null}
              {draft.aiJobStatus ? <Badge variant="outline">Job {draft.aiJobStatus}</Badge> : null}
            </div>
            <CardTitle>{draft.suggestedTitle}</CardTitle>
            <CardDescription>
              Draft gerado em {formatDateTime(draft.generatedAt)}
              {draft.reviewedAt ? ` | Revisado em ${formatDateTime(draft.reviewedAt)}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {draft.suggestedSubtitle ? <p className="text-lg text-muted-foreground">{draft.suggestedSubtitle}</p> : null}
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground md:grid-cols-2">
              <p>Categoria sugerida: {draft.categoryName ?? "Nao definida"}</p>
              <p>Autor sugerido: {draft.authorName ?? "Nao definido"}</p>
              <p>Localizacao: {draft.cityName ? `${draft.cityName}, ${draft.stateName}` : draft.stateName ?? "Nao definida"}</p>
              <p>Tags sugeridas: {draft.suggestedTagNames.length > 0 ? draft.suggestedTagNames.join(", ") : "Nenhuma"}</p>
            </div>
            {draft.suggestedSummary ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Resumo sugerido</h3>
                <p className="text-sm leading-7 text-muted-foreground">{draft.suggestedSummary}</p>
              </div>
            ) : null}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Conteudo sugerido</h3>
              <article className="whitespace-pre-wrap rounded-2xl border border-border/70 bg-background/70 p-5 text-sm leading-8 text-foreground">
                {draft.suggestedContent}
              </article>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Fontes registradas</h3>
              <div className="grid gap-2">
                {draft.sourceUrls.length > 0 ? (
                  draft.sourceUrls.map((sourceUrl) => (
                    <a key={sourceUrl} href={sourceUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                      {sourceUrl}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma fonte registrada neste draft.</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Sugestoes de midia</h3>
              {draft.mediaSuggestions.length > 0 ? (
                <div className="grid gap-3">
                  {draft.mediaSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                      <label className="mb-3 flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground">
                        <input
                          type="checkbox"
                          checked={selectedMediaSuggestionIds.includes(suggestion.id)}
                          onChange={() => toggleMediaSuggestion(suggestion.id)}
                          className="size-4 rounded border-border"
                        />
                        Usar na noticia convertida
                      </label>
                      {suggestion.mediaUrl || suggestion.externalUrl ? (
                        <img
                          src={suggestion.mediaUrl ?? suggestion.externalUrl ?? ""}
                          alt={suggestion.mediaCaption ?? "Sugestao de midia da IA"}
                          className="mb-3 h-44 w-full rounded-xl border border-border/70 object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        {suggestion.mediaFileId ? <Badge variant="accent">Midia interna</Badge> : <Badge variant="outline">Link externo</Badge>}
                        {suggestion.confidenceScore ? <Badge variant="outline">Confianca {suggestion.confidenceScore}</Badge> : null}
                        {suggestion.isSelected ? <Badge variant="default">Selecionada</Badge> : null}
                      </div>
                      <p className="mt-3 font-medium text-foreground">{suggestion.mediaCaption ?? suggestion.externalUrl ?? "Sugestao sem metadados complementares"}</p>
                      {suggestion.reason ? <p className="mt-1">{suggestion.reason}</p> : null}
                      {suggestion.externalUrl ? <a href={suggestion.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-primary hover:underline">Abrir sugestao</a> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma sugestao de midia registrada para este draft.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Revisao editorial</CardTitle>
            <CardDescription>Aprovacao, reprovacao e arquivamento mantem o draft no fluxo interno. Nenhuma acao publica conteudo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewState.message ? (
              <div className={cn("rounded-xl border px-4 py-3 text-sm", reviewState.status === "success" ? "border-primary/20 bg-primary/10 text-foreground" : "border-destructive/20 bg-destructive/10 text-destructive")}>
                {reviewState.message}
              </div>
            ) : null}
            <form action={reviewAction} className="space-y-4">
              <input type="hidden" name="id" value={draft.id} />
              <Textarea name="reviewNotes" value={formValues.reviewNotes} onChange={(event) => handleFieldChange("reviewNotes", event.target.value)} placeholder="Observacoes da revisao editorial" />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" name="status" value="APPROVED" variant="default" className="gap-2">
                  <CheckCircle2 className="size-4" />
                  Aprovar draft
                </Button>
                <Button type="submit" name="status" value="REJECTED" variant="outline" className="gap-2">
                  <XCircle className="size-4" />
                  Reprovar
                </Button>
                <Button type="submit" name="status" value="ARCHIVED" variant="secondary" className="gap-2">
                  <FileUp className="size-4" />
                  Arquivar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/95">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Converter em noticia</CardTitle>
              <CardDescription>Converte o draft em `News` com status `DRAFT_AI`, pronto para curadoria humana no modulo de noticias.</CardDescription>
            </div>
            {draft.newsId ? (
              <Button asChild variant="outline">
                <Link href="/admin/news">Abrir noticias</Link>
              </Button>
            ) : null}
          </div>
          {draft.newsId ? (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
              Draft ja convertido em noticia: {draft.linkedNewsTitle ?? draft.newsId}
            </div>
          ) : null}
          {convertState.message ? (
            <div className={cn("rounded-xl border px-4 py-3 text-sm", convertState.status === "success" ? "border-primary/20 bg-primary/10 text-foreground" : "border-destructive/20 bg-destructive/10 text-destructive")}>
              {convertState.message}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <form action={convertAction} className="space-y-5">
            <input type="hidden" name="aiDraftId" value={draft.id} />
            {formValues.tagIds.map((tagId) => <input key={tagId} type="hidden" name="tagIds" value={tagId} />)}
            {selectedMediaSuggestionIds.map((suggestionId) => (
              <input key={suggestionId} type="hidden" name="selectedMediaSuggestionIds" value={suggestionId} />
            ))}
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" name="title" value={formValues.title} onChange={(event) => handleFieldChange("title", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitulo</Label>
              <Input id="subtitle" name="subtitle" value={formValues.subtitle} onChange={(event) => handleFieldChange("subtitle", event.target.value)} />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Resumo</Label>
              <Textarea id="summary" name="summary" value={formValues.summary} onChange={(event) => handleFieldChange("summary", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Conteudo</Label>
              <Textarea id="content" name="content" value={formValues.content} onChange={(event) => handleFieldChange("content", event.target.value)} className="min-h-56" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <select id="categoryId" name="categoryId" value={formValues.categoryId} onChange={(event) => handleFieldChange("categoryId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Selecione</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorId">Autor</Label>
                <select id="authorId" name="authorId" value={formValues.authorId} onChange={(event) => handleFieldChange("authorId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Selecione</option>
                  {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateId">Estado</Label>
                <select id="stateId" name="stateId" value={formValues.stateId} onChange={(event) => handleFieldChange("stateId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Sem estado</option>
                  {states.map((stateItem) => <option key={stateItem.id} value={stateItem.id}>{stateItem.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityId">Cidade</Label>
                <select id="cityId" name="cityId" value={formValues.cityId} onChange={(event) => handleFieldChange("cityId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Sem cidade</option>
                  {visibleCities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Tags</Label>
                <p className="text-xs text-muted-foreground">Use as tags sugeridas pela IA como ponto de partida e ajuste antes de enviar ao fluxo editorial.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
                    <input type="checkbox" checked={formValues.tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} className="size-4 rounded border-border" />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" name="seoTitle" value={formValues.seoTitle} onChange={(event) => handleFieldChange("seoTitle", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea id="seoDescription" name="seoDescription" value={formValues.seoDescription} onChange={(event) => handleFieldChange("seoDescription", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Observacoes editoriais</Label>
              <Textarea id="reviewNotes" name="reviewNotes" value={formValues.reviewNotes} onChange={(event) => handleFieldChange("reviewNotes", event.target.value)} placeholder="Observacoes mantidas junto ao draft de IA apos a conversao" />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
              <input type="checkbox" name="commentsEnabled" checked={formValues.commentsEnabled} onChange={(event) => handleFieldChange("commentsEnabled", event.target.checked)} className="size-4 rounded border-border" />
              Permitir comentarios quando esta noticia for publicada futuramente
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gap-2" disabled={Boolean(draft.newsId)}>
                <Sparkles className="size-4" />
                Converter em noticia
              </Button>
              {draft.newsId ? (
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/admin/news">
                    Abrir modulo de noticias
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
