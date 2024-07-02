import 'reflect-metadata';

import { translationLoader } from '@roenlie/mimic-core/localize';

import { RouterElement } from './app/routes/router.cmp.js';
import { translationFiles } from './app/translations/export.js';

translationLoader(translationFiles);

RouterElement;
