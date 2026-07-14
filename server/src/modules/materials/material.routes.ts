import { Router } from 'express';
import * as materialController from './material.controller';

const router = Router();

// Rota pública - sem autenticação necessária
router.get('/', materialController.listMaterials);

export default router;
