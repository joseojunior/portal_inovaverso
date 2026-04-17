"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Bot, CheckCircle2, PencilLine, Plus, Power, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  runAISearchConfigNowAction,
  toggleAISearchConfigStatusAction,
  upsertAISearchConfigAction
} from "@/features/ai/server/actions";
import { initialAIConfigActionState, type AIConfigActionState } from "@/features/ai/server/action-state";
import { formatDateTime } from "@/lib/format-date";
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

type StateOption = OptionItem & {
  countryId: string;
};

type CityOption = OptionItem & {
  countryId: string;
  stateId: string;
};

type AIConfigItem = {
  id: string;
  name: string;
  description: string | null;
  query: string;
  sourceDomains: string[];
  excludedDomains: string[];
  keywords: string[];
  excludedKeywords: string[];
  languageCode: string | null;
  isActive: boolean;
  lookbackHours: number | null;
  maxSourcesPerRun: number | null;
  cronExpression: string | null;
  categoryId: string | null;
  categoryName: string | null;
  countryId: string | null;
  countryName: string | null;
  stateId: string | null;
  stateName: string | null;
  cityId: string | null;
  cityName: string | null;
  jobsCount: number;
  updatedAt: string;
};

type AISearchConfigsAdminPanelProps = {
  configs: AIConfigItem[];
  categories: OptionItem[];
  countries: OptionItem[];
  states: StateOption[];
  cities: CityOption[];
};

const emptyForm = {
  id: "",
  name: "",
  description: "",
  query: "",
  categoryId: "",
  countryId: "",
  stateId: "",
  cityId: "",
  languageCode: "pt-BR",
  lookbackHours: "24",
  maxSourcesPerRun: "12",
  cronExpression: "",
  sourceDomains: "",
  excludedDomains: "",
  keywords: "",
  excludedKeywords: "",
  isActive: true
};

function listToMultiline(value: string[]) {
  return value.join("\n");
}

export function AISearchConfigsAdminPanel({
  configs,
  categories,
  countries,
  states,
  cities
}: AISearchConfigsAdminPanelProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(upsertAISearchConfigAction, initialAIConfigActionState);
  const [isToggling, startToggleTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [toggleMessage, setToggleMessage] = useState<AIConfigActionState | null>(null);
  const [isRunning, startRunTransition] = useTransition();

  const editingConfig = useMemo(() => configs.find((config) => config.id === editingId) ?? null, [configs, editingId]);
  const visibleStates = useMemo(
    () => states.filter((stateItem) => !formValues.countryId || stateItem.countryId === formValues.countryId),
    [formValues.countryId, states]
  );
  const visibleCities = useMemo(
    () =>
      cities.filter((city) => {
        if (formValues.stateId) return city.stateId === formValues.stateId;
        if (formValues.countryId) return city.countryId === formValues.countryId;
        return true;
      }),
    [cities, formValues.countryId, formValues.stateId]
  );

  useEffect(() => {
    if (editingConfig) {
      setFormValues({
        id: editingConfig.id,
        name: editingConfig.name,
        description: editingConfig.description ?? "",
        query: editingConfig.query,
        categoryId: editingConfig.categoryId ?? "",
        countryId: editingConfig.countryId ?? "",
        stateId: editingConfig.stateId ?? "",
        cityId: editingConfig.cityId ?? "",
        languageCode: editingConfig.languageCode ?? "pt-BR",
        lookbackHours: editingConfig.lookbackHours ? String(editingConfig.lookbackHours) : "",
        maxSourcesPerRun: editingConfig.maxSourcesPerRun ? String(editingConfig.maxSourcesPerRun) : "",
        cronExpression: editingConfig.cronExpression ?? "",
        sourceDomains: listToMultiline(editingConfig.sourceDomains),
        excludedDomains: listToMultiline(editingConfig.excludedDomains),
        keywords: listToMultiline(editingConfig.keywords),
        excludedKeywords: listToMultiline(editingConfig.excludedKeywords),
        isActive: editingConfig.isActive
      });
      return;
    }

    setFormValues(emptyForm);
  }, [editingConfig]);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      setEditingId(null);
      setFormValues(emptyForm);
    }
  }, [router, state.status]);

  function handleFieldChange(field: keyof typeof formValues, value: string | boolean) {
    setFormValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "countryId" && typeof value === "string") {
        const nextStateStillValid = current.stateId && states.some((stateItem) => stateItem.id === current.stateId && stateItem.countryId === value);
        const nextCityStillValid = current.cityId && cities.some((city) => city.id === current.cityId && city.countryId === value);
        next.stateId = nextStateStillValid ? current.stateId : "";
        next.cityId = nextCityStillValid ? current.cityId : "";
      }

      if (field === "stateId" && typeof value === "string") {
        const nextCityStillValid = current.cityId && cities.some((city) => city.id === current.cityId && city.stateId === value);
        const selectedState = states.find((stateItem) => stateItem.id === value);
        next.cityId = nextCityStillValid ? current.cityId : "";
        next.countryId = selectedState?.countryId ?? current.countryId;
      }

      if (field === "cityId" && typeof value === "string") {
        const selectedCity = cities.find((city) => city.id === value);
        if (selectedCity) {
          next.stateId = selectedCity.stateId;
          next.countryId = selectedCity.countryId;
        }
      }

      return next;
    });
  }

  function resetForm() {
    setEditingId(null);
    setFormValues(emptyForm);
  }

  function handleToggle(configId: string, nextIsActive: boolean) {
    startToggleTransition(async () => {
      const result = await toggleAISearchConfigStatusAction(configId, nextIsActive);
      setToggleMessage(result);
      router.refresh();
    });
  }

  function handleRunNow(configId: string) {
    startRunTransition(async () => {
      const result = await runAISearchConfigNowAction(configId);
      setToggleMessage(result);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_26rem]">
      <div className="space-y-6">
        {toggleMessage ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            {toggleMessage.message}
          </div>
        ) : null}
        <div className="grid gap-4">
          {configs.length > 0 ? (
            configs.map((config) => (
              <Card key={config.id} className="border-border/70 bg-card/90">
                <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{config.name}</h3>
                      <Badge variant={config.isActive ? "accent" : "secondary"}>{config.isActive ? "Ativa" : "Inativa"}</Badge>
                      {config.categoryName ? <Badge variant="outline">{config.categoryName}</Badge> : null}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {config.description || "Sem descricao adicional. A consulta base define o foco editorial desta rotina."}
                    </p>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <div className="grid gap-1">
                        <p>Consulta base: {config.query}</p>
                        <p>Idioma: {config.languageCode ?? "Nao definido"}</p>
                        <p>Lookback: {config.lookbackHours ? `${config.lookbackHours}h` : "Nao definido"}</p>
                        <p>Maximo por execucao: {config.maxSourcesPerRun ?? "Nao definido"}</p>
                      </div>
                      <div className="grid gap-1">
                        <p>Escopo: {config.cityName ? `${config.cityName}, ${config.stateName}` : config.stateName ?? config.countryName ?? "Global"}</p>
                        <p>Jobs vinculados: {config.jobsCount}</p>
                        <p>Fontes priorizadas: {config.sourceDomains.length}</p>
                        <p>Atualizada em: {formatDateTime(config.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => setEditingId(config.id)}>
                      <PencilLine className="size-4" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      className="gap-2"
                      disabled={isRunning || !config.isActive}
                      onClick={() => handleRunNow(config.id)}
                    >
                      <Bot className="size-4" />
                      Executar agora
                    </Button>
                    <Button
                      type="button"
                      variant={config.isActive ? "outline" : "secondary"}
                      className="gap-2"
                      disabled={isToggling || isRunning}
                      onClick={() => handleToggle(config.id, !config.isActive)}
                    >
                      <Power className="size-4" />
                      {config.isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-border/70 bg-card/70">
              <CardContent className="py-8 text-sm text-muted-foreground">
                Nenhuma configuracao de IA cadastrada ainda. Crie a primeira para organizar futuras coletas e drafts.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="h-fit border-border/70 bg-card/95">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{editingConfig ? "Editar configuracao" : "Nova configuracao"}</CardTitle>
              <CardDescription>Base editorial para futuras rotinas de IA, sem integrar busca externa nesta etapa.</CardDescription>
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
              <Input id="name" name="name" value={formValues.name} onChange={(event) => handleFieldChange("name", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea id="description" name="description" value={formValues.description} onChange={(event) => handleFieldChange("description", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="query">Consulta base</Label>
              <Textarea id="query" name="query" value={formValues.query} onChange={(event) => handleFieldChange("query", event.target.value)} className="min-h-24" />
              {state.fieldErrors?.query ? <p className="text-xs text-destructive">{state.fieldErrors.query[0]}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <select id="categoryId" name="categoryId" value={formValues.categoryId} onChange={(event) => handleFieldChange("categoryId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Sem categoria fixa</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="languageCode">Idioma</Label>
                <Input id="languageCode" name="languageCode" value={formValues.languageCode} onChange={(event) => handleFieldChange("languageCode", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryId">Pais</Label>
                <select id="countryId" name="countryId" value={formValues.countryId} onChange={(event) => handleFieldChange("countryId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Sem pais fixo</option>
                  {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateId">Estado</Label>
                <select id="stateId" name="stateId" value={formValues.stateId} onChange={(event) => handleFieldChange("stateId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Sem estado fixo</option>
                  {visibleStates.map((stateItem) => <option key={stateItem.id} value={stateItem.id}>{stateItem.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cityId">Cidade</Label>
                <select id="cityId" name="cityId" value={formValues.cityId} onChange={(event) => handleFieldChange("cityId", event.target.value)} className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  <option value="">Sem cidade fixa</option>
                  {visibleCities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lookbackHours">Lookback (horas)</Label>
                <Input id="lookbackHours" name="lookbackHours" type="number" min={1} value={formValues.lookbackHours} onChange={(event) => handleFieldChange("lookbackHours", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSourcesPerRun">Maximo de fontes</Label>
                <Input id="maxSourcesPerRun" name="maxSourcesPerRun" type="number" min={1} value={formValues.maxSourcesPerRun} onChange={(event) => handleFieldChange("maxSourcesPerRun", event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cronExpression">Cron expression</Label>
              <Input id="cronExpression" name="cronExpression" value={formValues.cronExpression} onChange={(event) => handleFieldChange("cronExpression", event.target.value)} placeholder="0 */6 * * *" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceDomains">Dominios priorizados</Label>
              <Textarea id="sourceDomains" name="sourceDomains" value={formValues.sourceDomains} onChange={(event) => handleFieldChange("sourceDomains", event.target.value)} placeholder="um dominio por linha" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excludedDomains">Dominios excluidos</Label>
              <Textarea id="excludedDomains" name="excludedDomains" value={formValues.excludedDomains} onChange={(event) => handleFieldChange("excludedDomains", event.target.value)} placeholder="um dominio por linha" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-chave</Label>
              <Textarea id="keywords" name="keywords" value={formValues.keywords} onChange={(event) => handleFieldChange("keywords", event.target.value)} placeholder="uma palavra-chave por linha" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excludedKeywords">Palavras excluidas</Label>
              <Textarea id="excludedKeywords" name="excludedKeywords" value={formValues.excludedKeywords} onChange={(event) => handleFieldChange("excludedKeywords", event.target.value)} placeholder="uma palavra-chave por linha" />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm">
              <input type="checkbox" name="isActive" checked={formValues.isActive} onChange={(event) => handleFieldChange("isActive", event.target.checked)} className="size-4 rounded border-border" />
              Configuracao ativa para uso em futuros jobs
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="gap-2">
                {editingConfig ? <PencilLine className="size-4" /> : <Bot className="size-4" />}
                {editingConfig ? "Salvar configuracao" : "Criar configuracao"}
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
