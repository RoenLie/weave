import { SQLite } from '@roenlie/sqlite-wrapper';
import { paths } from '../../app/paths.ts';


const ocrData = new SQLite(paths.data);
