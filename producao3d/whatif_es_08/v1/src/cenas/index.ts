// familia -> cena
import React from 'react';
import {CenaProps} from './tipos';
import {Cena as cont} from './cont';
import {Cena as salinas} from './salinas';
import {Cena as bsas} from './bsas';
import {Cena as cdmx} from './cdmx';
import {Cena as lapaz} from './lapaz';
import {Cena as eureka_gelo} from './eureka_gelo';
import {Cena as eureka_ar} from './eureka_ar';
import {Cena as real} from './real';
export const CENAS: Record<string, React.FC<CenaProps>> = {cont, salinas, bsas, cdmx, lapaz, eureka_gelo, eureka_ar, real};
