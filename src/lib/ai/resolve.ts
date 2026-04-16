import type { Prisma, PrismaClient } from "@prisma/client";

import { db } from "@/lib/db";

type AIResolvedReferences = {
  categoryId: string | null;
  authorId: string | null;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
};

type ResolveDbClient = PrismaClient | Prisma.TransactionClient;

export async function resolveDraftReferences(input: {
  categorySlug: string | null;
  authorSlug: string | null;
  countryCode: string | null;
  stateCode: string | null;
  citySlug: string | null;
  dbClient?: ResolveDbClient;
}): Promise<AIResolvedReferences> {
  const client = input.dbClient ?? db;

  const [category, author, country] = await Promise.all([
    input.categorySlug ? client.category.findUnique({ where: { slug: input.categorySlug }, select: { id: true } }) : Promise.resolve(null),
    input.authorSlug ? client.author.findUnique({ where: { slug: input.authorSlug }, select: { id: true } }) : Promise.resolve(null),
    input.countryCode
      ? client.country.findFirst({
          where: {
            OR: [{ isoCode2: input.countryCode }, { isoCode3: input.countryCode }]
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ]);

  const state = input.stateCode
    ? await client.state.findFirst({
        where: {
          code: input.stateCode,
          ...(country?.id ? { countryId: country.id } : {})
        },
        select: { id: true, countryId: true }
      })
    : null;

  const city = input.citySlug
    ? await client.city.findFirst({
        where: {
          slug: input.citySlug,
          ...(state?.id ? { stateId: state.id } : {}),
          ...(country?.id ? { countryId: country.id } : {})
        },
        select: { id: true, stateId: true, countryId: true }
      })
    : null;

  return {
    categoryId: category?.id ?? null,
    authorId: author?.id ?? null,
    countryId: city?.countryId ?? state?.countryId ?? country?.id ?? null,
    stateId: city?.stateId ?? state?.id ?? null,
    cityId: city?.id ?? null
  };
}
