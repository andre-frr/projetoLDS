import {departamentoResolvers} from "./resolvers/departamento.js";
import {areaCientificaResolvers} from "./resolvers/area_cientifica.js";
import {docenteResolvers} from "./resolvers/docente.js";
import {cursoResolvers} from "./resolvers/curso.js";
import {ucResolvers} from "./resolvers/uc.js";
import {docenteGrauResolvers} from "./resolvers/docente_grau.js";
import {historicoCVDocenteResolvers} from "./resolvers/historico_cv_docente.js";
import {ucHorasContactoResolvers} from "./resolvers/uc_horas_contacto.js";
import {anoLetivoResolvers} from "./resolvers/ano_letivo.js";
import merge from 'lodash.merge';

export const resolvers = merge(
    departamentoResolvers,
    areaCientificaResolvers,
    docenteResolvers,
    cursoResolvers,
    ucResolvers,
    docenteGrauResolvers,
    historicoCVDocenteResolvers,
    ucHorasContactoResolvers,
    anoLetivoResolvers
);
