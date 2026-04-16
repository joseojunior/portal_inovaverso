"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, PencilLine, Plus, Power, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  toggleCategoryStatusAction,
  upsertCategoryAction
} from "@/features/categories/server/actions";
import { initialCategoryActionState, type CategoryActionState } from "@/features/categories/server/action-state";
import { slugify } from "@/lib/slugify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  parentId: string | null;
  parentName: string | null;
  newsCount: number;
  childrenCount: number;
};

type CategoriesAdminPanelProps = {
  categories: CategoryItem[];
};

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  parentId: "",
  sortOrder: "0",
  isActive: true
};

export function CategoriesAdminPanel({ categories }: CategoriesAdminPanelProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(upsertCategoryAction, initialCategoryActionState);
  const [isToggling, startToggleTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [toggleMessage, setToggleMessage] = useState<CategoryActionState | null>(null);

  const editingCategory = useMemo(
    () => categories.find((category) => category.id === editingId) ?? null,
    [categories, editingId]
  );

  useEffect(() => {
    if (editingCategory) {
      setFormValues({
        id: editingCategory.id,
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description ?? "",
        seoTitle: editingCategory.seoTitle ?? "",
        seoDescription: editingCategory.seoDescription ?? "",
        parentId: editingCategory.parentId ?? "",
        sortOrder: String(editingCategory.sortOrder),
        isActive: editingCategory.isActive
      });
      setIsSlugDirty(true);
      return;
    }

    setFormValues(emptyForm);
    setIsSlugDirty(false);
  }, [editingCategory]);

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

  function startCreateMode() {
    setEditingId(null);
    setToggleMessage(null);
  }

  function startEditMode(categoryId: string) {
    setEditingId(categoryId);
    setToggleMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setFormValues(emptyForm);
    setIsSlugDirty(false);
  }

  function handleToggle(categoryId: string, nextIsActive: boolean) {
    startToggleTransition(async () => {
      const result = await toggleCategoryStatusAction(categoryId, nextIsActive);
      setToggleMessage(result);
      router.refresh();
    });
  }

  const parentOptions = categories.filter((category) => category.id !== editingId);

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
          {categories.map((category) => (
            <Card key={category.id} className="border-border/70 bg-card/90">
              <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                    <Badge variant={category.isActive ? "accent" : "secondary"}>
                      {category.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant="outline">{category.slug}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p>{category.description || "Sem descrição editorial cadastrada."}</p>
                    <div className="grid gap-1">
                      <p>Ordem: {category.sortOrder}</p>
                      <p>Pai: {category.parentName ?? "Categoria raiz"}</p>
                      <p>Notícias vinculadas: {category.newsCount}</p>
                      <p>Subcategorias: {category.childrenCount}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => startEditMode(category.id)}
                  >
                    <PencilLine className="size-4" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant={category.isActive ? "outline" : "secondary"}
                    className="gap-2"
                    disabled={isToggling}
                    onClick={() => handleToggle(category.id, !category.isActive)}
                  >
                    <Power className="size-4" />
                    {category.isActive ? "Desativar" : "Ativar"}
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
              <CardTitle>{editingCategory ? "Editar categoria" : "Nova categoria"}</CardTitle>
              <CardDescription>
                Estrutura editorial com slug consistente, ordem e metadados básicos de SEO.
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={startCreateMode}>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parentId">Categoria pai</Label>
                <select
                  id="parentId"
                  name="parentId"
                  value={formValues.parentId}
                  onChange={(event) => handleFieldChange("parentId", event.target.value)}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Categoria raiz</option>
                  {parentOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.parentId ? (
                  <p className="text-xs text-destructive">{state.fieldErrors.parentId[0]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordem</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  value={formValues.sortOrder}
                  onChange={(event) => handleFieldChange("sortOrder", event.target.value)}
                />
                {state.fieldErrors?.sortOrder ? (
                  <p className="text-xs text-destructive">{state.fieldErrors.sortOrder[0]}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input
                id="seoTitle"
                name="seoTitle"
                value={formValues.seoTitle}
                onChange={(event) => handleFieldChange("seoTitle", event.target.value)}
              />
              {state.fieldErrors?.seoTitle ? (
                <p className="text-xs text-destructive">{state.fieldErrors.seoTitle[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                value={formValues.seoDescription}
                onChange={(event) => handleFieldChange("seoDescription", event.target.value)}
              />
              {state.fieldErrors?.seoDescription ? (
                <p className="text-xs text-destructive">{state.fieldErrors.seoDescription[0]}</p>
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
              Categoria ativa para uso editorial
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gap-2">
                {editingCategory ? <PencilLine className="size-4" /> : <Plus className="size-4" />}
                {editingCategory ? "Salvar alterações" : "Criar categoria"}
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
