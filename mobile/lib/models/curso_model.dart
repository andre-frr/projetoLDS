class CursoModel {
  final int id;
  final String nome;
  final String sigla;
  final String tipo;
  final bool ativo;

  CursoModel({
    required this.id,
    required this.nome,
    required this.sigla,
    required this.tipo,
    required this.ativo,
  });

  factory CursoModel.fromJson(Map<String, dynamic> json) {
    return CursoModel(
      id: json['id_curso'] as int,
      nome: json['nome'] as String,
      sigla: json['sigla'] as String,
      tipo: json['tipo'] as String,
      ativo: json['ativo'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_curso': id,
      'nome': nome,
      'sigla': sigla,
      'tipo': tipo,
      'ativo': ativo,
    };
  }

  CursoModel copyWith({
    int? id,
    String? nome,
    String? sigla,
    String? tipo,
    bool? ativo,
  }) {
    return CursoModel(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      sigla: sigla ?? this.sigla,
      tipo: tipo ?? this.tipo,
      ativo: ativo ?? this.ativo,
    );
  }

  String get tipoNome {
    switch (tipo) {
      case 'TeSP':
        return 'Técnico Superior Profissional';
      case 'LIC':
        return 'Licenciatura';
      case 'MEST':
        return 'Mestrado';
      case 'DOUT':
        return 'Doutoramento';
      default:
        return tipo;
    }
  }
}
