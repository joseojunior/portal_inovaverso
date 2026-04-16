"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Globe, PencilLine, Plus, Power, RotateCcw, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  toggleAuthorStatusAction,
  upsertAuthorAction
} from "@/features/authors/server/actions";
import { initialAuthorActionState, type AuthorActionState } from "@/features/authors/server/action-state";
import { slugify } from "@/lib/slugify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AuthorLinks = {
  website?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
};

type AuthorItem = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  bio: string | null;
  socialLinks: AuthorLinks | null;
  isActive: boolean;
  newsCount: number;
};

type AuthorsAdminPanelProps = {
  authors: AuthorItem[];
};

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  avatarUrl: "",
  bio: "",
  websiteUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  xUrl: "",
  isActive: true
};

export function AuthorsAdminPanel({ authors }: AuthorsAdminPanelProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(upsertAuthorAction, initialAuthorActionState);
  const [isToggling, startToggleTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [toggleMessage, setToggleMessage] = useState<AuthorActionState | null>(null);

  const editingAuthor = useMemo(
    () => authors.find((author) => author.id === editingId) ?? null,
    [authors, editingId]
  );

  useEffect(() => {
    if (editingAuthor) {
      setFormValues({
        id: editingAuthor.id,
        name: editingAuthor.name,
        slug: editingAuthor.slug,
        avatarUrl: editingAuthor.avatarUrl ?? "",
        bio: editingAuthor.bio ?? "",
        websiteUrl: editingAuthor.socialLinks?.website ?? "",
        instagramUrl: editingAuthor.socialLinks?.instagram ?? "",
        linkedinUrl: editingAuthor.socialLinks?.linkedin ?? "",
        xUrl: editingAuthor.socialLinks?.x ?? "",
        isActive: editingAuthor.isActive
      });
      setIsSlugDirty(true);
      return;
    }

    setFormValues(emptyForm);
    setIsSlugDirty(false);
  }, [editingAuthor]);

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

  function handleToggle(authorId: string, nextIsActive: boolean) {
    startToggleTransition(async () => {
      const result = await toggleAuthorStatusAction(authorId, nextIsActive);
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
          {authors.map((author) => (
            <Card key={author.id} className="border-border/70 bg-card/90">
              <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-primary">
                      <UserRound className="size-6" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{author.name}</h3>
                        <Badge variant={author.isActive ? "accent" : "secondary"}>
                          {author.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">{author.slug}</Badge>
                      </div>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        {author.bio || "Sem biografia cadastrada para o perfil público."}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Notícias vinculadas: {author.newsCount}</span>
                        <span>Links sociais: {author.socialLinks ? Object.keys(author.socialLinks).length : 0}</span>
                      </div>
                      {author.socialLinks ? (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(author.socialLinks).map(([key, value]) => (
                            <a
                              key={key}
                              href={value}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Globe className="size-3" />
                              {key}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setEditingId(author.id)}
                  >
                    <PencilLine className="size-4" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant={author.isActive ? "outline" : "secondary"}
                    className="gap-2"
                    disabled={isToggling}
                    onClick={() => handleToggle(author.id, !author.isActive)}
                  >
                    <Power className="size-4" />
                    {author.isActive ? "Desativar" : "Ativar"}
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
              <CardTitle>{editingAuthor ? "Editar autor" : "Novo autor"}</CardTitle>
              <CardDescription>
                Perfil editorial preparado para páginas públicas, avatar, bio e links sociais.
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
              />
              {state.fieldErrors?.slug ? <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                value={formValues.avatarUrl}
                onChange={(event) => handleFieldChange("avatarUrl", event.target.value)}
                placeholder="https://..."
              />
              {state.fieldErrors?.avatarUrl ? (
                <p className="text-xs text-destructive">{state.fieldErrors.avatarUrl[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formValues.bio}
                onChange={(event) => handleFieldChange("bio", event.target.value)}
              />
              {state.fieldErrors?.bio ? <p className="text-xs text-destructive">{state.fieldErrors.bio[0]}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formValues.websiteUrl}
                  onChange={(event) => handleFieldChange("websiteUrl", event.target.value)}
                  placeholder="https://..."
                />
                {state.fieldErrors?.websiteUrl ? (
                  <p className="text-xs text-destructive">{state.fieldErrors.websiteUrl[0]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram</Label>
                <Input
                  id="instagramUrl"
                  name="instagramUrl"
                  value={formValues.instagramUrl}
                  onChange={(event) => handleFieldChange("instagramUrl", event.target.value)}
                  placeholder="https://instagram.com/..."
                />
                {state.fieldErrors?.instagramUrl ? (
                  <p className="text-xs text-destructive">{state.fieldErrors.instagramUrl[0]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  value={formValues.linkedinUrl}
                  onChange={(event) => handleFieldChange("linkedinUrl", event.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
                {state.fieldErrors?.linkedinUrl ? (
                  <p className="text-xs text-destructive">{state.fieldErrors.linkedinUrl[0]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="xUrl">X / Twitter</Label>
                <Input
                  id="xUrl"
                  name="xUrl"
                  value={formValues.xUrl}
                  onChange={(event) => handleFieldChange("xUrl", event.target.value)}
                  placeholder="https://x.com/..."
                />
                {state.fieldErrors?.xUrl ? <p className="text-xs text-destructive">{state.fieldErrors.xUrl[0]}</p> : null}
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
              <input
                type="checkbox"
                name="isActive"
                checked={formValues.isActive}
                onChange={(event) => handleFieldChange("isActive", event.target.checked)}
                className="size-4 rounded border-border"
              />
              Autor ativo para uso editorial e exibição pública
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gap-2">
                {editingAuthor ? <PencilLine className="size-4" /> : <Plus className="size-4" />}
                {editingAuthor ? "Salvar alterações" : "Criar autor"}
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
