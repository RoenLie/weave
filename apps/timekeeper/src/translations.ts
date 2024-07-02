import { translationFiles, translationLoader } from '@eyeshare/web-components';

import { translationExports } from './translations/export.js';

translationLoader(translationFiles, translationExports);
