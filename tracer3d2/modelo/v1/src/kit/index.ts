// Registro do kit: nome da cena -> componente. cenas/*.json: {"<batida>": {"comp": "<nome>", "props": {...}}}
import {KitMap} from './tipos';
import {KIT_UI} from './ui';
import {KIT_KARTEN} from './karten';
import {KIT_WELT} from './welt';
import {KIT_EPOCA} from './epoca';
import UI from '../cenas/ui.json';
import KARTEN from '../cenas/karten.json';
import WELT from '../cenas/welt.json';
import EPOCA from '../cenas/epoca.json';

export const KIT: KitMap = {...KIT_UI, ...KIT_KARTEN, ...KIT_WELT, ...KIT_EPOCA};
export type Cena = {comp: string; props?: any};
export const CENAS: Record<string, Cena> = {...(UI as any), ...(KARTEN as any), ...(WELT as any), ...(EPOCA as any)};
