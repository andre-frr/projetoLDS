class DepartamentoModel {
  final int id;
  final String nome;
  final String sigla;
  final bool ativo;

  DepartamentoModel({
    required this.id,
    required this.nome,
    required this.sigla,
    required this.ativo,
  });

  factory DepartamentoModel.fromJson(Map<String, dynamic> json) {
    return DepartamentoModel(
      id: json['id_dep'] ?? json['id_departamento'] ?? json['id'] ?? 0,
      nome: json['nome'] ?? '',
      sigla: json['sigla'] ?? '',
      ativo: json['ativo'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_departamento': id,
      'nome': nome,
      'sigla': sigla,
      'ativo': ativo,
    };
  }

  DepartamentoModel copyWith({
    int? id,
    String? nome,
    String? sigla,
    bool? ativo,
  }) {
    return DepartamentoModel(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      sigla: sigla ?? this.sigla,
      ativo: ativo ?? this.ativo,
    );
  }
}
