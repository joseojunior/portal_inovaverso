"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Hash, PencilLine, Plus, Power, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  toggleTagStatusAction,
  upsertTagAction
} from "@/features/tags/server/actions";
import { initialTagActionState, type TagActionState } from "@/features/tags/server/action-state";
import { formatShortDate } from "@/lib/format-date";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TagItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  newsCount: number;
  createdAt: string;
};

type TagsAdminPanelProps = {
  tags: TagItem[];
};

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  description: "",
  isActive: true
};

export function TagsAdminPanel({ tags }: TagsAdminPanelProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(upsertTagAction, initialTagActionState);
  const [isToggling, startToggleTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [toggleMessage, setToggleMessage] = useState<TagActionState | null>(null);

  const editingTag = useMemo(() => tags.find((tag) => tag.id === editingId) ?? null, [tags, editingId]);

  useEffect(() => {
    if (editingTag) {
      setFormValues({
        id: editingTag.id,
        name: editingTag.name,
        slug: editingTag.slug,
        description: editingTag.description ?? "",
        isActive: editingTag.isActive
      });
      setIsSlugDirty(true);
      return;
    }

    setFormValues(emptyForm);
    setIsSlugDirty(false);
  }, [editingTag]);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      setEditingId(null);
      setFormValues(emptyForm);
      setIsSlugDirty(false);
    }
  }, [router, state.status]);

  function handleFieldChange(field: keyof typeof formValues, value: string | boolean) {
    setFormValues((current) => {
      const next = {
        ...current,
        [field]: value
      };

      if (field === "name" && !isSlugDirty && typeof value === "string") {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  function resetForm() {
    setEditingId(null);
    setFormValues(emptyForm);
    setIsSlugDirty(false);
  }

  function handleToggle(tagId: string, nextIsActive: boolean) {
    startToggleTransition(async () => {
      const result = await toggleTagStatusAction(tagId, nextIsActive);
      setToggleMessage(result);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_24rem]">
      <div className="space-y-6">
        {toggleMessage ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            {toggleMessage.message}
          </div>
        ) : null}
        <div className="grid gap-4">
          {tags.map((tag) => (
            <Card key={tag.id} className="border-border/70 bg-card/90">
              <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{tag.name}</h3>
                    <Badge variant={tag.isActive ? "accent" : "secondary"}>
                      {tag.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant="outline">{tag.slug}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-[minmax(0,1fr)_16rem]">
                    <p>{tag.description || "Sem descrição editorial cadastrada para esta tag."}</p>
                    <div className="grid gap-1">
                      <p>Notícias vinculadas: {tag.newsCount}</p>
                      <p>Cadastro: {formatShortDate(tag.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => setEditingId(tag.id)}>
                    <PencilLine className="size-4" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant={tag.isActive ? "outline" : "secondary"}
                    className="gap-2"
                    disabled={isToggling}
                    onClick={() => handleToggle(tag.id, !tag.isActive)}
                  >
                    <Power className="size-4" />
                    {tag.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="h-fit border-border/70 bg-card/95">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{editingTag ? "Editar tag" : "Nova tag"}</CardTitle>
              <CardDescription>
                Classificação granular para cobertura editorial, descoberta e futuras combinações de busca.
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
              {state.message}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="id" value={formValues.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                required
              />
              {state.fieldErrors?.name ? <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p> : null}
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
                placeholder="slug-automatico-ou-editavel"
              />
              <p className="text-xs text-muted-foreground">
                O slug acompanha o nome até você editar manualmente.
              </p>
              {state.fieldErrors?.slug ? <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formValues.description}
                onChange={(event) => handleFieldChange("description", event.target.value)}
              />
              {state.fieldErrors?.description ? (
                <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
              ) : null}
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
              <input
                type="checkbox"
                name="isActive"
                checked={formValues.isActive}
                onChange={(event) => handleFieldChange("isActive", event.target.checked)}
                className="size-4 rounded border-border"
              />
              Tag ativa para associação em notícias
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gap-2">
                {editingTag ? <PencilLine className="size-4" /> : <Hash className="size-4" />}
                {editingTag ? "Salvar alterações" : "Criar tag"}
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
