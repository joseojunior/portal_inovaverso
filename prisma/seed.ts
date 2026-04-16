import { AdminRole, PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const seedConfig = {
  baseAdminEmail: process.env.SEED_BASE_ADMIN_EMAIL ?? "plataforma@inovaverso.local",
  superAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@inovaverso.local",
  initialPassword: process.env.SEED_INITIAL_PASSWORD ?? "Inovaverso@2026!"
};

async function upsertUser() {
  const passwordHash = await hashPassword(seedConfig.initialPassword);

  return prisma.user.upsert({
    where: { email: seedConfig.baseAdminEmail },
    update: {
      name: "Administrador da Plataforma",
      slug: "administrador-da-plataforma",
      passwordHash,
      isActive: true
    },
    create: {
      email: seedConfig.baseAdminEmail,
      name: "Administrador da Plataforma",
      slug: "administrador-da-plataforma",
      passwordHash,
      isActive: true
    }
  });
}

async function upsertAdminUser() {
  const passwordHash = await hashPassword(seedConfig.initialPassword);

  return prisma.adminUser.upsert({
    where: { email: seedConfig.superAdminEmail },
    update: {
      name: "Super Admin Inovaverso",
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true
    },
    create: {
      email: seedConfig.superAdminEmail,
      name: "Super Admin Inovaverso",
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true
    }
  });
}

async function main() {
  const user = await upsertUser();
  const adminUser = await upsertAdminUser();

  const country = await prisma.country.upsert({
    where: { isoCode2: "BR" },
    update: {
      name: "Brasil",
      slug: "brasil",
      isoCode3: "BRA",
      phoneCode: "+55",
      isActive: true
    },
    create: {
      name: "Brasil",
      slug: "brasil",
      isoCode2: "BR",
      isoCode3: "BRA",
      phoneCode: "+55",
      isActive: true
    }
  });

  const state = await prisma.state.upsert({
    where: {
      countryId_code: {
        countryId: country.id,
        code: "AM"
      }
    },
    update: {
      name: "Amazonas",
      slug: "amazonas",
      isActive: true
    },
    create: {
      countryId: country.id,
      name: "Amazonas",
      slug: "amazonas",
      code: "AM",
      isActive: true
    }
  });

  await prisma.city.upsert({
    where: {
      stateId_slug: {
        stateId: state.id,
        slug: "manaus"
      }
    },
    update: {
      countryId: country.id,
      name: "Manaus",
      isCapital: true,
      isActive: true
    },
    create: {
      countryId: country.id,
      stateId: state.id,
      name: "Manaus",
      slug: "manaus",
      isCapital: true,
      isActive: true
    }
  });

  await prisma.city.upsert({
    where: {
      stateId_slug: {
        stateId: state.id,
        slug: "parintins"
      }
    },
    update: {
      countryId: country.id,
      name: "Parintins",
      isCapital: false,
      isActive: true
    },
    create: {
      countryId: country.id,
      stateId: state.id,
      name: "Parintins",
      slug: "parintins",
      isCapital: false,
      isActive: true
    }
  });

  const categories = [
    {
      name: "Política",
      slug: "politica",
      description: "Cobertura política, institucional e de gestão pública."
    },
    {
      name: "Economia",
      slug: "economia",
      description: "Negócios, mercado, desenvolvimento e empreendedorismo."
    },
    {
      name: "Cidades",
      slug: "cidades",
      description: "Cotidiano urbano, serviços, mobilidade e território."
    }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
  }

  const tags = [
    {
      name: "Manaus",
      slug: "manaus",
      description: "Cobertura e recortes relacionados à capital amazonense."
    },
    {
      name: "Amazonas",
      slug: "amazonas",
      description: "Temas regionais ligados ao estado do Amazonas."
    },
    {
      name: "Inovação",
      slug: "inovacao",
      description: "Transformação digital, tecnologia e inovação."
    }
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag
    });
  }

  await prisma.author.upsert({
    where: { slug: "redacao-inovaverso" },
    update: {
      adminUserId: adminUser.id,
      name: "Redação Inovaverso",
      email: "redacao@inovaverso.local",
      bio: "Equipe editorial oficial do Portal Inovaverso.",
      isActive: true
    },
    create: {
      adminUserId: adminUser.id,
      name: "Redação Inovaverso",
      slug: "redacao-inovaverso",
      email: "redacao@inovaverso.local",
      bio: "Equipe editorial oficial do Portal Inovaverso.",
      isActive: true
    }
  });

  console.log("Seed concluído.");
  console.log(`User base: ${seedConfig.baseAdminEmail}`);
  console.log(`Super admin: ${seedConfig.superAdminEmail}`);
  console.log(`Senha inicial: ${seedConfig.initialPassword}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
