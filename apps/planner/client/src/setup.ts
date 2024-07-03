import 'reflect-metadata';

import { translationLoader } from '@roenlie/core/localize';

import { RouterElement } from './app/routes/router.cmp.js';
import { translationFiles } from './app/translations/export.js';

translationLoader(translationFiles);

RouterElement;
