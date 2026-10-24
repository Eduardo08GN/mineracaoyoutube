// Registro do kit: nome da cena -> componente. cenas/*.json: {"<batida>": {"comp": "<nome>", "props": {...}}}
import {KitMap} from './tipos';
import {KIT_UI} from './ui';
import {KIT_KARTEN} from './karten';
import {KIT_WELT} from './welt';
import UI from '../cenas/ui.json';
import KARTEN from '../cenas/karten.json';
import WELT from '../cenas/welt.json';

export const KIT: KitMap = {...KIT_UI, ...KIT_KARTEN, ...KIT_WELT};
export type Cena = {comp: string; props?: any};
export const CENAS: Record<string, Cena> = {...(UI as any), ...(KARTEN as any), ...(WELT as any)};
