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
    { name: 'Orgânico', icon: '🍎', category: 'organic', recyclable: true, pointsPerKg: 5 },
    { name: 'Têxtil', icon: '👕', category: 'textile', recyclable: true, pointsPerKg: 12 },
    { name: 'Madeira', icon: '🪵', category: 'wood', recyclable: true, pointsPerKg: 10 },
    { name: 'Não Reciclável', icon: '🗑️', category: 'non_recyclable', recyclable: false, pointsPerKg: 0 },
    { name: 'Outros', icon: '📦', category: 'other', recyclable: true, pointsPerKg: 8 },
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
