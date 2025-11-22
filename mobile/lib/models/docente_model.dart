class DocenteModel {
  final int id;
  final String nome;
  final int idArea;
  final String email;
  final bool ativo;
  final bool convidado;

  DocenteModel({
    required this.id,
    required this.nome,
    required this.idArea,
    required this.email,
    required this.ativo,
    required this.convidado,
  });

  factory DocenteModel.fromJson(Map<String, dynamic> json) {
    return DocenteModel(
      id: json['id_doc'] as int,
      nome: json['nome'] as String,
      idArea: json['id_area'] as int,
      email: json['email'] as String,
      ativo: json['ativo'] as bool,
      convidado: json['convidado'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_doc': id,
      'nome': nome,
      'id_area': idArea,
      'email': email,
      'ativo': ativo,
      'convidado': convidado,
    };
  }

  DocenteModel copyWith({
    int? id,
    String? nome,
    int? idArea,
    String? email,
    bool? ativo,
    bool? convidado,
  }) {
    return DocenteModel(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      idArea: idArea ?? this.idArea,
      email: email ?? this.email,
      ativo: ativo ?? this.ativo,
      convidado: convidado ?? this.convidado,
    );
  }
}
