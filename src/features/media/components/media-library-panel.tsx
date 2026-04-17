"use client";

import { type MediaStatus, type MediaType } from "@prisma/client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Film, ImagePlus, PencilLine, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { ResponsiveVideoEmbed } from "@/components/media/responsive-video-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmbeddedVideoAction,
  updateMediaMetadataAction,
  uploadImageAction
} from "@/features/media/server/actions";
import { initialMediaActionState } from "@/features/media/server/action-state";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  type: MediaType;
  publicUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  credit: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  status: MediaStatus;
  originalFilename: string | null;
  mimeType: string | null;
  createdAt: string;
  uploadedByName: string;
};

type MediaLibraryPanelProps = {
  items: MediaItem[];
};

const mediaStatusOptions: Array<{ value: MediaStatus; label: string }> = [
  { value: "PENDING_REVIEW", label: "Em revisao" },
  { value: "APPROVED", label: "Aprovada" },
  { value: "REJECTED", label: "Rejeitada" }
];

const emptyMetadataForm = {
  id: "",
  altText: "",
  caption: "",
  credit: "",
  sourceUrl: "",
  sourceName: "",
  embedInput: "",
  status: "PENDING_REVIEW" as MediaStatus
};

function statusVariant(status: MediaStatus) {
  if (status === "APPROVED") return "accent";
  if (status === "REJECTED") return "secondary";
  return "outline";
}

function typeVariant(type: MediaType) {
  return type === "VIDEO" ? "default" : "outline";
}

function MediaPreview({ item, title }: { item: MediaItem; title: string }) {
  if (item.type === "VIDEO" && item.embedUrl) {
    return <ResponsiveVideoEmbed embedUrl={item.embedUrl} title={title} />;
  }

  return (
    <div className="aspect-[4/3] overflow-hidden bg-background/80">
      <img src={item.thumbnailUrl ?? item.publicUrl} alt={item.altText ?? title} className="h-full w-full object-cover" />
    </div>
  );
}

export function MediaLibraryPanel({ items }: MediaLibraryPanelProps) {
  const router = useRouter();
  const [uploadState, uploadAction] = useActionState(uploadImageAction, initialMediaActionState);
  const [embedState, embedAction] = useActionState(createEmbeddedVideoAction, initialMediaActionState);
  const [metadataState, metadataAction] = useActionState(updateMediaMetadataAction, initialMediaActionState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [metadataValues, setMetadataValues] = useState(emptyMetadataForm);

  const editingItem = useMemo(() => items.find((item) => item.id === editingId) ?? null, [items, editingId]);

  useEffect(() => {
    if (editingItem) {
      setMetadataValues({
        id: editingItem.id,
        altText: editingItem.altText ?? "",
        caption: editingItem.caption ?? "",
        credit: editingItem.credit ?? "",
        sourceUrl: editingItem.sourceUrl ?? "",
        sourceName: editingItem.sourceName ?? "",
        embedInput: editingItem.publicUrl ?? "",
        status: editingItem.status
      });
      return;
    }

    setMetadataValues(emptyMetadataForm);
  }, [editingItem]);

  useEffect(() => {
    if (uploadState.status === "success" || embedState.status === "success" || metadataState.status === "success") {
      router.refresh();
    }
  }, [embedState.status, metadataState.status, router, uploadState.status]);

  function handleMetadataChange(field: keyof typeof metadataValues, value: string) {
    setMetadataValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_26rem]">
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden border-border/70 bg-card/90">
            <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
              <MediaPreview item={item} title={item.altText ?? item.caption ?? item.originalFilename ?? "Midia"} />
              <CardContent className="flex flex-col gap-4 py-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  <Badge variant={typeVariant(item.type)}>{item.type}</Badge>
                  <Badge variant="outline">{item.mimeType ?? (item.type === "VIDEO" ? "embed" : "image/*")}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{item.originalFilename ?? (item.type === "VIDEO" ? "Video embedado" : "Imagem enviada")}</p>
                  <p className="text-sm text-muted-foreground">{item.caption || "Sem legenda cadastrada."}</p>
                </div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <p>URL publica: {item.publicUrl}</p>
                  {item.embedUrl ? <p>Embed: {item.embedUrl}</p> : null}
                  <p>Credito: {item.credit ?? "Nao informado"}</p>
                  <p>Fonte: {item.sourceName ?? "Nao informada"}</p>
                  <p>Upload por: {item.uploadedByName}</p>
                </div>
                <div>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => setEditingId(item.id)}>
                    <PencilLine className="size-4" />
                    Revisar metadados
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="space-y-3">
            <CardTitle>Upload de imagem</CardTitle>
            <CardDescription>Envie imagens para a biblioteca e revise antes de usar nas materias.</CardDescription>
            {uploadState.message ? (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  uploadState.status === "success"
                    ? "border-primary/20 bg-primary/10 text-foreground"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                )}
              >
                {uploadState.status === "success" ? <CheckCircle2 className="mr-2 inline size-4" /> : null}
                {uploadState.message}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <form action={uploadAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="file">Imagem</Label>
                <Input id="file" name="file" type="file" accept="image/*" required />
                {uploadState.fieldErrors?.file ? <p className="text-xs text-destructive">{uploadState.fieldErrors.file[0]}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText">Alt text</Label>
                <Input id="altText" name="altText" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Legenda</Label>
                <Textarea id="caption" name="caption" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit">Credito</Label>
                <Input id="credit" name="credit" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sourceName">Nome da fonte</Label>
                  <Input id="sourceName" name="sourceName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">URL da fonte</Label>
                  <Input id="sourceUrl" name="sourceUrl" placeholder="https://..." />
                </div>
              </div>
              <Button type="submit" className="gap-2">
                <ImagePlus className="size-4" />
                Enviar imagem
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="space-y-3">
            <CardTitle>Cadastro de video incorporado</CardTitle>
            <CardDescription>Adicione videos por URL (YouTube ou Vimeo), sem upload local.</CardDescription>
            {embedState.message ? (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  embedState.status === "success"
                    ? "border-primary/20 bg-primary/10 text-foreground"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                )}
              >
                {embedState.status === "success" ? <CheckCircle2 className="mr-2 inline size-4" /> : null}
                {embedState.message}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <form action={embedAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="embedInput">URL do video</Label>
                <Input id="embedInput" name="embedInput" placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..." />
                {embedState.fieldErrors?.embedInput ? <p className="text-xs text-destructive">{embedState.fieldErrors.embedInput[0]}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="embed-altText">Titulo acessivel</Label>
                <Input id="embed-altText" name="altText" placeholder="Titulo ou descricao curta do video" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="embed-caption">Legenda</Label>
                <Textarea id="embed-caption" name="caption" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="embed-credit">Credito</Label>
                <Input id="embed-credit" name="credit" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="embed-sourceName">Nome da fonte</Label>
                  <Input id="embed-sourceName" name="sourceName" placeholder="YouTube, Vimeo ou fonte editorial" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="embed-sourceUrl">URL da fonte</Label>
                  <Input id="embed-sourceUrl" name="sourceUrl" placeholder="https://..." />
                </div>
              </div>
              <Button type="submit" className="gap-2">
                <Film className="size-4" />
                Registrar video
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="space-y-3">
            <CardTitle>{editingItem ? "Revisar midia" : "Selecione uma midia"}</CardTitle>
            <CardDescription>Atualize metadados editoriais e o status de revisao sem alterar a relacao com noticias.</CardDescription>
            {metadataState.message ? (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  metadataState.status === "success"
                    ? "border-primary/20 bg-primary/10 text-foreground"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                )}
              >
                {metadataState.status === "success" ? <CheckCircle2 className="mr-2 inline size-4" /> : null}
                {metadataState.message}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {editingItem ? (
              <form action={metadataAction} className="space-y-5">
                <input type="hidden" name="id" value={metadataValues.id} />
                <MediaPreview item={editingItem} title={editingItem.altText ?? editingItem.originalFilename ?? "Preview"} />
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={metadataValues.status}
                    onChange={(event) => handleMetadataChange("status", event.target.value)}
                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {mediaStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {editingItem.type === "VIDEO" ? (
                  <div className="space-y-2">
                    <Label htmlFor="metadata-embedInput">URL do video</Label>
                    <Input
                      id="metadata-embedInput"
                      name="embedInput"
                      value={metadataValues.embedInput}
                      onChange={(event) => handleMetadataChange("embedInput", event.target.value)}
                    />
                    {metadataState.fieldErrors?.embedInput ? <p className="text-xs text-destructive">{metadataState.fieldErrors.embedInput[0]}</p> : null}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="metadata-altText">Texto alternativo</Label>
                  <Input
                    id="metadata-altText"
                    name="altText"
                    value={metadataValues.altText}
                    onChange={(event) => handleMetadataChange("altText", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metadata-caption">Legenda</Label>
                  <Textarea
                    id="metadata-caption"
                    name="caption"
                    value={metadataValues.caption}
                    onChange={(event) => handleMetadataChange("caption", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metadata-credit">Credito</Label>
                  <Input
                    id="metadata-credit"
                    name="credit"
                    value={metadataValues.credit}
                    onChange={(event) => handleMetadataChange("credit", event.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="metadata-sourceName">Nome da fonte</Label>
                    <Input
                      id="metadata-sourceName"
                      name="sourceName"
                      value={metadataValues.sourceName}
                      onChange={(event) => handleMetadataChange("sourceName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metadata-sourceUrl">URL da fonte</Label>
                    <Input
                      id="metadata-sourceUrl"
                      name="sourceUrl"
                      value={metadataValues.sourceUrl}
                      onChange={(event) => handleMetadataChange("sourceUrl", event.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <p>URL publica: {editingItem.publicUrl}</p>
                  {editingItem.embedUrl ? <p>URL de incorporacao: {editingItem.embedUrl}</p> : null}
                  <p>Enviado por: {editingItem.uploadedByName}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" className="gap-2">
                    <RefreshCw className="size-4" />
                    Salvar revisao
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                    Fechar
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Selecione uma imagem ou video embedado da biblioteca para revisar metadados, origem e status editorial.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
