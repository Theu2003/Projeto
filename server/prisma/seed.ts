import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed the database with initial materials data
 * Run with: npx tsx prisma/seed.ts
 */
export async function main() {
  const materials = [
    // Papéis e papelão
    { name: 'Papel', icon: '📄', category: 'paper', recyclable: true, pointsPerKg: 10 },
    { name: 'Papelão', icon: '📦', category: 'paper', recyclable: true, pointsPerKg: 8 },

    // Plásticos
    { name: 'Plástico', icon: '♻️', category: 'plastic', recyclable: true, pointsPerKg: 15 },
    { name: 'Garrafa PET', icon: '🧴', category: 'plastic', recyclable: true, pointsPerKg: 18 },

    // Vidros
    { name: 'Vidro', icon: '🍾', category: 'glass', recyclable: true, pointsPerKg: 20 },

    // Metais
    { name: 'Alumínio', icon: '🥫', category: 'metal', recyclable: true, pointsPerKg: 25 },
    { name: 'Metal', icon: '🔩', category: 'metal', recyclable: true, pointsPerKg: 22 },

    // Eletrônicos
    { name: 'Eletrônicos', icon: '💻', category: 'electronic', recyclable: true, pointsPerKg: 30 },

    // Óleo e pilhas
    { name: 'Óleo de Cozinha', icon: '🫒', category: 'oil', recyclable: true, pointsPerKg: 12 },
    { name: 'Pilhas e Baterias', icon: '🔋', category: 'hazardous', recyclable: true, pointsPerKg: 5 },

    // Outros
    { name: 'Têxtil', icon: '👕', category: 'textile', recyclable: true, pointsPerKg: 12 },
  ];

  console.log('🌱 Seeding materials...');

  for (const material of materials) {
    const id = material.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+$/, '')
      .replace(/^_+/, '');

    await prisma.material.upsert({
      where: { id },
      update: {},
      create: {
        id,
        ...material,
      },
    });
  }

  // Remover materiais que não estão mais na lista
  const currentIds = materials.map((m) =>
    m.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+$/, '')
      .replace(/^_+/, '')
  );

  const deleted = await prisma.material.deleteMany({
    where: { id: { notIn: currentIds } },
  });

  if (deleted.count > 0) {
    console.log(`🗑️ ${deleted.count} materiais obsoletos removidos`);
  }

  console.log(`✅ ${materials.length} materiais inseridos com sucesso!`);
}

// Executa apenas quando o arquivo é rodado diretamente (não quando importado em testes)
const isMainModule = process.argv[1]?.includes('seed');
if (isMainModule) {
  main()
    .catch((e) => {
      console.error('❌ Erro no seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
