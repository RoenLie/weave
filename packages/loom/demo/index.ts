import { Router } from '@roenlie/loom';
import { rootModule } from './src/pages/root/root-module.ts';


new Router(document.body, rootModule);
