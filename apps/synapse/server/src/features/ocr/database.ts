import { SQLite } from '@roenlie/sqlite-wrapper';
import { paths } from '../../app/paths.ts';


export const ocrDatabase = new SQLite(paths.data);
