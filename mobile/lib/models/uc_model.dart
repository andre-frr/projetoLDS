class UCModel {
  final int id;
  final String nome;
  final int idCurso;
  final int idArea;
  final int anoCurso;
  final int semCurso;
  final double ects;
  final int horasPorEcts;
  final bool ativo;

  UCModel({
    required this.id,
    required this.nome,
    required this.idCurso,
    required this.idArea,
    required this.anoCurso,
    required this.semCurso,
    required this.ects,
    this.horasPorEcts = 28,
    required this.ativo,
  });

  factory UCModel.fromJson(Map<String, dynamic> json) {
    return UCModel(
      id: json['id_uc'],
      nome: json['nome'],
      idCurso: json['id_curso'],
      idArea: json['id_area'],
      anoCurso: json['ano_curso'],
      semCurso: json['sem_curso'],
      ects: json['ects'] is String
          ? double.parse(json['ects'])
          : (json['ects'] as num).toDouble(),
      horasPorEcts: json['horas_por_ects'] ?? 28,
      ativo: json['ativo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_uc': id,
      'nome': nome,
      'id_curso': idCurso,
      'id_area': idArea,
      'ano_curso': anoCurso,
      'sem_curso': semCurso,
      'ects': ects,
      'horas_por_ects': horasPorEcts,
      'ativo': ativo,
    };
  }

  UCModel copyWith({
    int? id,
    String? nome,
    int? idCurso,
    int? idArea,
    int? anoCurso,
    int? semCurso,
    double? ects,
    int? horasPorEcts,
    bool? ativo,
  }) {
    return UCModel(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      idCurso: idCurso ?? this.idCurso,
      idArea: idArea ?? this.idArea,
      anoCurso: anoCurso ?? this.anoCurso,
      semCurso: semCurso ?? this.semCurso,
      ects: ects ?? this.ects,
      horasPorEcts: horasPorEcts ?? this.horasPorEcts,
      ativo: ativo ?? this.ativo,
    );
  }
}
