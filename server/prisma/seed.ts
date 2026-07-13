import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

export async function main() {
  const materials = [
    { name: 'Papel', icon: '📄', category: 'paper', recyclable: true, pointsPerKg: 10 },
    { name: 'Plástico', icon: '♻️', category: 'plastic', recyclable: true, pointsPerKg: 15 },
    { name: 'Vidro', icon: '🍾', category: 'glass', recyclable: true, pointsPerKg: 20 },
    { name: 'Metal', icon: '🔩', category: 'metal', recyclable: true, pointsPerKg: 25 },
    { name: 'Orgânico', icon: '🍎', category: 'organic', recyclable: true, pointsPerKg: 5 },
    { name: 'Eletrônicos', icon: '💻', category: 'electronic', recyclable: true, pointsPerKg: 30 },
    { name: 'Têxtil', icon: '👕', category: 'textile', recyclable: true, pointsPerKg: 12 },
    { name: 'Não Reciclável', icon: '🗑️', category: 'non_recyclable', recyclable: false, pointsPerKg: 0 },
  ];

  for (const material of materials) {
    await prisma.material.upsert({
      where: { id: material.name.toLowerCase().replace(/\s+/g, '_') },
      update: {},
      create: {
        id: material.name.toLowerCase().replace(/\s+/g, '_'),
        ...material,
      },
    });
  }

  console.log('Seed completed: materials inserted');
}

const currentFile = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/') === currentFile.replace(/\\/g, '/');

if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
