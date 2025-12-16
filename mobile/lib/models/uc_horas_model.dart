class UCHorasModel {
  final String tipo;
  final int horas;

  UCHorasModel({required this.tipo, required this.horas});

  factory UCHorasModel.fromJson(Map<String, dynamic> json) {
    return UCHorasModel(
      tipo: json['tipo_hora'] as String,
      horas: json['horas'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {'tipo_hora': tipo, 'horas': horas};
  }
}
