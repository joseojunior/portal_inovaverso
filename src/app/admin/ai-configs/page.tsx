import { notFound } from "next/navigation";

import { AISearchConfigsAdminPanel } from "@/features/ai/components/ai-search-configs-admin-panel";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";

export default async function AdminAIConfigsPage() {
  const adminUser = await requireAdminUser();

  if (!["SUPER_ADMIN", "ADMIN"].includes(adminUser.role)) {
    notFound();
  }

  const [configs, categories, countries, states, cities] = await Promise.all([
    db.aISearchConfig.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        query: true,
        sourceDomains: true,
        excludedDomains: true,
        keywords: true,
        excludedKeywords: true,
        languageCode: true,
        isActive: true,
        lookbackHours: true,
        maxSourcesPerRun: true,
        cronExpression: true,
        updatedAt: true,
        categoryId: true,
        countryId: true,
        stateId: true,
        cityId: true,
        category: { select: { name: true } },
        country: { select: { name: true } },
        state: { select: { name: true } },
        city: { select: { name: true } },
        _count: { select: { aiJobs: true } }
      }
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true } }),
    db.country.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true } }),
    db.state.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true, countryId: true } }),
    db.city.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }], select: { id: true, name: true, isActive: true, countryId: true, stateId: true } })
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="IA Editorial"
        title="Configuracoes de busca"
        description="Base administrativa para organizar escopos, filtros e prioridades das futuras rotinas de IA editorial."
      />
      <Card>
        <CardHeader>
          <CardTitle>Escopo desta etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>As configuracoes definem contexto editorial e parametros de coleta em Google News RSS.</p>
          <p>A execucao manual gera job com draft de IA em estado pendente para curadoria humana obrigatoria.</p>
        </CardContent>
      </Card>
      <AISearchConfigsAdminPanel
        configs={configs.map((config) => ({
          id: config.id,
          name: config.name,
          description: config.description,
          query: config.query,
          sourceDomains: config.sourceDomains,
          excludedDomains: config.excludedDomains,
          keywords: config.keywords,
          excludedKeywords: config.excludedKeywords,
          languageCode: config.languageCode,
          isActive: config.isActive,
          lookbackHours: config.lookbackHours,
          maxSourcesPerRun: config.maxSourcesPerRun,
          cronExpression: config.cronExpression,
          categoryId: config.categoryId,
          categoryName: config.category?.name ?? null,
          countryId: config.countryId,
          countryName: config.country?.name ?? null,
          stateId: config.stateId,
          stateName: config.state?.name ?? null,
          cityId: config.cityId,
          cityName: config.city?.name ?? null,
          jobsCount: config._count.aiJobs,
          updatedAt: config.updatedAt.toISOString()
        }))}
        categories={categories}
        countries={countries}
        states={states}
        cities={cities}
      />
    </div>
  );
}
