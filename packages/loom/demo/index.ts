import { Router } from '@roenlie/loom';
import { rootModule } from './root-module.ts';


const router = new Router();
router.route('/', async () => rootModule);
router.start(document.body);
