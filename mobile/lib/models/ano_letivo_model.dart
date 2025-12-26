class AnoLetivoModel {
  final int id;
  final int anoInicio;
  final int anoFim;
  final bool arquivado;
  final bool? isCurrent;

  AnoLetivoModel({
    required this.id,
    required this.anoInicio,
    required this.anoFim,
    required this.arquivado,
    this.isCurrent,
  });

  factory AnoLetivoModel.fromJson(Map<String, dynamic> json) {
    return AnoLetivoModel(
      id: json['id_ano'] as int,
      anoInicio: json['ano_inicio'] as int,
      anoFim: json['ano_fim'] as int,
      arquivado: json['arquivado'] as bool? ?? false,
      isCurrent: json['is_current'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_ano': id,
      'ano_inicio': anoInicio,
      'ano_fim': anoFim,
      'arquivado': arquivado,
      if (isCurrent != null) 'is_current': isCurrent,
    };
  }

  String get displayName => '$anoInicio/$anoFim';

  @override
  String toString() => displayName;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AnoLetivoModel &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          anoInicio == other.anoInicio &&
          anoFim == other.anoFim;

  @override
  int get hashCode => id.hashCode ^ anoInicio.hashCode ^ anoFim.hashCode;
}
