import {departamentoTypeDefs} from "./types/departamento.js";
import {areaCientificaTypeDefs} from "./types/area_cientifica.js";
import {docenteTypeDefs} from "./types/docente.js";
import {cursoTypeDefs} from "./types/curso.js";
import {ucTypeDefs} from "./types/uc.js";
import {docenteGrauTypeDefs} from "./types/docente_grau.js";
import {historicoCVDocenteTypeDefs} from "./types/historico_cv_docente.js";
import {ucHorasContactoTypeDefs} from "./types/uc_horas_contacto.js";
import {anoLetivoTypeDefs} from "./types/ano_letivo.js";

export const typeDefs = [
    departamentoTypeDefs,
    areaCientificaTypeDefs,
    docenteTypeDefs,
    cursoTypeDefs,
    ucTypeDefs,
    docenteGrauTypeDefs,
    historicoCVDocenteTypeDefs,
    ucHorasContactoTypeDefs,
    anoLetivoTypeDefs
];
