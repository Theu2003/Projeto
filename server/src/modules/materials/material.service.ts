import { prisma } from '@/config/database';

/**
 * Lista todos os materiais cadastrados
 * Ordenados alfabeticamente por nome
 */
export async function listMaterials() {
  return prisma.material.findMany({
    where: { recyclable: true },
    orderBy: { name: 'asc' },
  });
}
