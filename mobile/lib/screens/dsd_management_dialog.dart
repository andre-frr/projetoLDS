import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/dsd_model.dart';
import '../models/uc_horas_model.dart';
import '../models/uc_model.dart';
import '../providers/docente_provider.dart';
import '../providers/dsd_provider.dart';
import '../services/uc_service.dart';

class DsdManagementDialog extends StatefulWidget {
  final UCModel uc;
  final DsdGroupModel? existingGroup;

  const DsdManagementDialog({super.key, required this.uc, this.existingGroup});

  @override
  State<DsdManagementDialog> createState() => _DsdManagementDialogState();
}

class _DsdManagementDialogState extends State<DsdManagementDialog> {
  String _selectedTurma = 'A';
  String _selectedTipo = 'PL';
  final List<_TeacherAssignment> _assignments = [];
  bool _isLoading = false;
  List<UCHorasModel> _ucHoras = [];
  bool _loadingHoras = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });

    if (widget.existingGroup != null) {
      _selectedTurma = widget.existingGroup!.turma;
      _selectedTipo = widget.existingGroup!.tipo;
      _assignments.addAll(
        widget.existingGroup!.assignments.map(
          (a) => _TeacherAssignment(
            docenteId: a.idDoc,
            docenteNome: a.docenteNome,
            horas: a.horas,
          ),
        ),
      );
    }
  }

  Future<void> _loadData() async {
    await Future.wait([_loadDocentes(), _loadUCHoras()]);
  }

  Future<void> _loadDocentes() async {
    final docenteProvider = context.read<DocenteProvider>();
    if (docenteProvider.docentes.isEmpty) {
      await docenteProvider.loadAll();
    }
  }

  Future<void> _loadUCHoras() async {
    setState(() => _loadingHoras = true);

    try {
      final horas = await UCService().getHoras(widget.uc.id);

      // Filter out types with 0 hours
      final filteredHoras = horas.where((h) => h.horas > 0).toList();

      setState(() {
        _ucHoras = filteredHoras;
        _loadingHoras = false;

        // If current selected tipo is not available, select the first available one
        if (filteredHoras.isNotEmpty &&
            !filteredHoras.any((h) => h.tipo == _selectedTipo)) {
          _selectedTipo = filteredHoras.first.tipo;
        }
      });
    } catch (e) {
      setState(() => _loadingHoras = false);
      // If error loading hours, show all types as fallback
    }
  }

  void _addAssignment() {
    setState(() {
      _assignments.add(_TeacherAssignment());
    });
  }

  void _removeAssignment(int index) {
    setState(() {
      _assignments.removeAt(index);
    });
  }

  Future<void> _save() async {
    // Validate
    if (_assignments.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Adicione pelo menos um docente')),
      );
      return;
    }

    for (final assignment in _assignments) {
      if (assignment.docenteId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Selecione um docente para todas as atribuições'),
          ),
        );
        return;
      }
      if (assignment.horas <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('As horas devem ser maiores que zero')),
        );
        return;
      }
    }

    setState(() => _isLoading = true);

    final dsdProvider = context.read<DsdProvider>();
    final request = DsdCreateRequest(
      idUc: widget.uc.id,
      turma: _selectedTurma,
      tipo: _selectedTipo,
      assignments: _assignments
          .map((a) => DsdAssignmentRequest(idDoc: a.docenteId!, horas: a.horas))
          .toList(),
    );

    final success = await dsdProvider.create(request);

    setState(() => _isLoading = false);

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('DSD criado com sucesso'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(dsdProvider.errorMessage ?? 'Erro ao criar DSD'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final docenteProvider = context.watch<DocenteProvider>();

    return AlertDialog(
      title: Text('Gerir DSD - ${widget.uc.nome}'),
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Turma selection
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Turma',
                  border: OutlineInputBorder(),
                ),
                initialValue: _selectedTurma,
                items: ['A', 'B'].map((t) {
                  return DropdownMenuItem(value: t, child: Text('Turma $t'));
                }).toList(),
                onChanged: widget.existingGroup == null
                    ? (value) {
                        setState(() {
                          _selectedTurma = value!;
                        });
                      }
                    : null,
              ),
              const SizedBox(height: 16),

              // Tipo selection - only show types with hours > 0
              _loadingHoras
                  ? const Center(child: CircularProgressIndicator())
                  : _ucHoras.isEmpty
                  ? const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Text(
                          'Nenhum tipo de horas configurado para esta UC',
                          style: TextStyle(color: Colors.orange),
                        ),
                      ),
                    )
                  : DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Tipo de Horas',
                        border: OutlineInputBorder(),
                      ),
                      value: _ucHoras.any((h) => h.tipo == _selectedTipo)
                          ? _selectedTipo
                          : (_ucHoras.isNotEmpty ? _ucHoras.first.tipo : null),
                      items: _ucHoras.map((ucHora) {
                        return DropdownMenuItem(
                          value: ucHora.tipo,
                          child: Text(_getTipoLabel(ucHora)),
                        );
                      }).toList(),
                      onChanged: widget.existingGroup == null
                          ? (value) {
                              setState(() {
                                _selectedTipo = value!;
                              });
                            }
                          : null,
                    ),
              const SizedBox(height: 24),

              // Assignments
              Text(
                'Atribuições de Docentes',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),

              // List of assignments
              ..._assignments.asMap().entries.map((entry) {
                final index = entry.key;
                final assignment = entry.value;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Row(
                      children: [
                        // Docente selector
                        Expanded(
                          flex: 2,
                          child: DropdownButtonFormField<int>(
                            decoration: const InputDecoration(
                              labelText: 'Docente',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            initialValue: assignment.docenteId,
                            items: docenteProvider.docentes.map((docente) {
                              return DropdownMenuItem(
                                value: docente.id,
                                child: Text(docente.nome),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() {
                                assignment.docenteId = value;
                                assignment.docenteNome = docenteProvider
                                    .docentes
                                    .firstWhere((d) => d.id == value)
                                    .nome;
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Hours input
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(
                              labelText: 'Horas',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            keyboardType: TextInputType.number,
                            controller: TextEditingController(
                              text: assignment.horas > 0
                                  ? assignment.horas.toString()
                                  : '',
                            ),
                            onChanged: (value) {
                              assignment.horas = int.tryParse(value) ?? 0;
                            },
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Remove button
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _removeAssignment(index),
                        ),
                      ],
                    ),
                  ),
                );
              }),

              // Add assignment button
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _addAssignment,
                icon: const Icon(Icons.add),
                label: const Text('Adicionar Docente'),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _save,
          child: _isLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Guardar'),
        ),
      ],
    );
  }

  String _getTipoLabel(UCHorasModel ucHora) {
    final tipoDescriptions = {
      'PL': 'PL - Prática Laboratorial',
      'T': 'T - Teórica',
      'TP': 'TP - Teórico-Prática',
      'OT': 'OT - Outra',
    };

    final description = tipoDescriptions[ucHora.tipo] ?? ucHora.tipo;
    return '$description (${ucHora.horas}h disponíveis)';
  }
}

class _TeacherAssignment {
  int? docenteId;
  String? docenteNome;
  int horas;

  _TeacherAssignment({this.docenteId, this.docenteNome, this.horas = 0});
}
