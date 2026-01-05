class DsdModel {
  final int idDsd;
  final int idDoc;
  final int idAno;
  final int idUc;
  final String tipo;
  final int horas;
  final String turma;
  final String? docenteNome;
  final String? docenteEmail;
  final String? ucNome;
  final int? idCurso;
  final String? cursoNome;
  final String? cursoSigla;
  final int? anoInicio;
  final int? anoFim;
  final bool? arquivado;

  DsdModel({
    required this.idDsd,
    required this.idDoc,
    required this.idAno,
    required this.idUc,
    required this.tipo,
    required this.horas,
    required this.turma,
    this.docenteNome,
    this.docenteEmail,
    this.ucNome,
    this.idCurso,
    this.cursoNome,
    this.cursoSigla,
    this.anoInicio,
    this.anoFim,
    this.arquivado,
  });

  factory DsdModel.fromJson(Map<String, dynamic> json) {
    return DsdModel(
      idDsd: json['id_dsd'] as int,
      idDoc: json['id_doc'] as int,
      idAno: json['id_ano'] as int,
      idUc: json['id_uc'] as int,
      tipo: json['tipo'] as String,
      horas: json['horas'] as int,
      turma: json['turma'] as String,
      docenteNome: json['docente_nome'] as String?,
      docenteEmail: json['docente_email'] as String?,
      ucNome: json['uc_nome'] as String?,
      idCurso: json['id_curso'] as int?,
      cursoNome: json['curso_nome'] as String?,
      cursoSigla: json['curso_sigla'] as String?,
      anoInicio: json['ano_inicio'] as int?,
      anoFim: json['ano_fim'] as int?,
      arquivado: json['arquivado'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_dsd': idDsd,
      'id_doc': idDoc,
      'id_ano': idAno,
      'id_uc': idUc,
      'tipo': tipo,
      'horas': horas,
      'turma': turma,
      if (docenteNome != null) 'docente_nome': docenteNome,
      if (docenteEmail != null) 'docente_email': docenteEmail,
      if (ucNome != null) 'uc_nome': ucNome,
      if (idCurso != null) 'id_curso': idCurso,
      if (cursoNome != null) 'curso_nome': cursoNome,
      if (cursoSigla != null) 'curso_sigla': cursoSigla,
      if (anoInicio != null) 'ano_inicio': anoInicio,
      if (anoFim != null) 'ano_fim': anoFim,
      if (arquivado != null) 'arquivado': arquivado,
    };
  }

  DsdModel copyWith({
    int? idDsd,
    int? idDoc,
    int? idAno,
    int? idUc,
    String? tipo,
    int? horas,
    String? turma,
    String? docenteNome,
    String? docenteEmail,
    String? ucNome,
    int? idCurso,
    String? cursoNome,
    String? cursoSigla,
    int? anoInicio,
    int? anoFim,
    bool? arquivado,
  }) {
    return DsdModel(
      idDsd: idDsd ?? this.idDsd,
      idDoc: idDoc ?? this.idDoc,
      idAno: idAno ?? this.idAno,
      idUc: idUc ?? this.idUc,
      tipo: tipo ?? this.tipo,
      horas: horas ?? this.horas,
      turma: turma ?? this.turma,
      docenteNome: docenteNome ?? this.docenteNome,
      docenteEmail: docenteEmail ?? this.docenteEmail,
      ucNome: ucNome ?? this.ucNome,
      idCurso: idCurso ?? this.idCurso,
      cursoNome: cursoNome ?? this.cursoNome,
      cursoSigla: cursoSigla ?? this.cursoSigla,
      anoInicio: anoInicio ?? this.anoInicio,
      anoFim: anoFim ?? this.anoFim,
      arquivado: arquivado ?? this.arquivado,
    );
  }

  String get displayName {
    return '$ucNome - Turma $turma - $tipo (${horas}h)';
  }

  String get yearDisplay {
    if (anoInicio != null && anoFim != null) {
      return '$anoInicio/$anoFim';
    }
    return '';
  }
}

class DsdGroupModel {
  final String turma;
  final String tipo;
  final AnoLetivoInfo anoLetivo;
  final List<DsdAssignment> assignments;
  final int totalHoras;

  DsdGroupModel({
    required this.turma,
    required this.tipo,
    required this.anoLetivo,
    required this.assignments,
    required this.totalHoras,
  });

  factory DsdGroupModel.fromJson(Map<String, dynamic> json) {
    return DsdGroupModel(
      turma: json['turma'] as String,
      tipo: json['tipo'] as String,
      anoLetivo: AnoLetivoInfo.fromJson(json['ano_letivo']),
      assignments: (json['assignments'] as List)
          .map((a) => DsdAssignment.fromJson(a))
          .toList(),
      totalHoras: json['total_horas'] as int,
    );
  }
}

class AnoLetivoInfo {
  final int idAno;
  final int anoInicio;
  final int anoFim;

  AnoLetivoInfo({
    required this.idAno,
    required this.anoInicio,
    required this.anoFim,
  });

  factory AnoLetivoInfo.fromJson(Map<String, dynamic> json) {
    return AnoLetivoInfo(
      idAno: json['id_ano'] as int,
      anoInicio: json['ano_inicio'] as int,
      anoFim: json['ano_fim'] as int,
    );
  }

  String get displayName => '$anoInicio/$anoFim';
}

class DsdAssignment {
  final int idDsd;
  final int idDoc;
  final String docenteNome;
  final String docenteEmail;
  final int horas;

  DsdAssignment({
    required this.idDsd,
    required this.idDoc,
    required this.docenteNome,
    required this.docenteEmail,
    required this.horas,
  });

  factory DsdAssignment.fromJson(Map<String, dynamic> json) {
    return DsdAssignment(
      idDsd: json['id_dsd'] as int,
      idDoc: json['id_doc'] as int,
      docenteNome: json['docente_nome'] as String,
      docenteEmail: json['docente_email'] as String,
      horas: json['horas'] as int,
    );
  }
}

class DsdCreateRequest {
  final int idUc;
  final String turma;
  final String tipo;
  final List<DsdAssignmentRequest> assignments;

  DsdCreateRequest({
    required this.idUc,
    required this.turma,
    required this.tipo,
    required this.assignments,
  });

  Map<String, dynamic> toJson() {
    return {
      'id_uc': idUc,
      'turma': turma,
      'tipo': tipo,
      'assignments': assignments.map((a) => a.toJson()).toList(),
    };
  }
}

class DsdAssignmentRequest {
  final int idDoc;
  final int horas;

  DsdAssignmentRequest({required this.idDoc, required this.horas});

  Map<String, dynamic> toJson() {
    return {'id_doc': idDoc, 'horas': horas};
  }
}
