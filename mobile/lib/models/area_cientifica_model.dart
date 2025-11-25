class AreaCientificaModel {
  final int id;
  final String nome;
  final String sigla;
  final int idDep;
  final bool ativo;

  AreaCientificaModel({
    required this.id,
    required this.nome,
    required this.sigla,
    required this.idDep,
    required this.ativo,
  });

  factory AreaCientificaModel.fromJson(Map<String, dynamic> json) {
    return AreaCientificaModel(
      id: json['id_area'] as int,
      nome: json['nome'] as String,
      sigla: json['sigla'] as String,
      idDep: json['id_dep'] as int,
      ativo: json['ativo'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_area': id,
      'nome': nome,
      'sigla': sigla,
      'id_dep': idDep,
      'ativo': ativo,
    };
  }

  AreaCientificaModel copyWith({
    int? id,
    String? nome,
    String? sigla,
    int? idDep,
    bool? ativo,
  }) {
    return AreaCientificaModel(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      sigla: sigla ?? this.sigla,
      idDep: idDep ?? this.idDep,
      ativo: ativo ?? this.ativo,
    );
  }
}
