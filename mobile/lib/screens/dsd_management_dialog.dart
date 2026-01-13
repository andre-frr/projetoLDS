import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/dsd_model.dart';
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
  List<UCHorasAllocationModel> _hoursAllocation = [];
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
    await _loadDocentes();
    await _loadHoursAllocation();
  }

  Future<void> _loadDocentes() async {
    final docenteProvider = context.read<DocenteProvider>();
    if (docenteProvider.docentes.isEmpty) {
      await docenteProvider.loadAll();
    }
  }

  Future<void> _loadHoursAllocation() async {
    setState(() => _loadingHoras = true);

    try {
      final allocation = await UCService().getHoursAllocation(
        widget.uc.id,
        _selectedTurma,
      );

      // Filter out fully allocated types (unless editing existing)
      final availableTypes = widget.existingGroup != null
          ? allocation
          : allocation.where((a) => !a.isFullyAllocated).toList();

      setState(() {
        _hoursAllocation = availableTypes;
        _loadingHoras = false;

        // If current selected tipo is not available, select the first available one
        if (availableTypes.isNotEmpty &&
            !availableTypes.any((a) => a.tipo == _selectedTipo)) {
          _selectedTipo = availableTypes.first.tipo;
        }
      });
    } catch (e) {
      setState(() => _loadingHoras = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao carregar alocação de horas: $e'),
            backgroundColor: Colors.orange,
          ),
        );
      }
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

  int get _totalAssignedHours {
    return _assignments.fold(0, (sum, a) => sum + a.horas);
  }

  int get _availableHours {
    final allocation = _hoursAllocation.firstWhere(
      (a) => a.tipo == _selectedTipo,
      orElse: () => UCHorasAllocationModel(
        idUc: widget.uc.id,
        tipo: _selectedTipo,
        turma: _selectedTurma,
        totalHoras: 0,
        allocatedHoras: 0,
        availableHoras: 0,
      ),
    );
    return allocation.availableHoras;
  }

  String? _validateHours() {
    if (_totalAssignedHours > _availableHours) {
      return 'Horas excedidas: ${_totalAssignedHours}h atribuídas mas apenas ${_availableHours}h disponíveis';
    }
    return null;
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

    // Validate hours don't exceed available
    final hoursError = _validateHours();
    if (hoursError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(hoursError), backgroundColor: Colors.red),
      );
      return;
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
                        if (value != null) {
                          setState(() {
                            _selectedTurma = value;
                          });
                          _loadHoursAllocation(); // Reload hours for new turma
                        }
                      }
                    : null,
              ),
              const SizedBox(height: 16),

              // Tipo selection - only show types with available hours
              _loadingHoras
                  ? const Center(child: CircularProgressIndicator())
                  : _hoursAllocation.isEmpty
                  ? const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Text(
                          'Todas as horas já foram alocadas ou nenhum tipo de horas configurado',
                          style: TextStyle(color: Colors.orange),
                        ),
                      ),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        DropdownButtonFormField<String>(
                          decoration: const InputDecoration(
                            labelText: 'Tipo de Horas',
                            border: OutlineInputBorder(),
                          ),
                          initialValue:
                              _hoursAllocation.any(
                                (h) => h.tipo == _selectedTipo,
                              )
                              ? _selectedTipo
                              : (_hoursAllocation.isNotEmpty
                                    ? _hoursAllocation.first.tipo
                                    : null),
                          items: _hoursAllocation.map((allocation) {
                            return DropdownMenuItem(
                              value: allocation.tipo,
                              child: Text(_getTipoLabel(allocation)),
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
                        // Show hours summary
                        if (_hoursAllocation.any(
                          (a) => a.tipo == _selectedTipo,
                        ))
                          Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: _buildHoursSummary(),
                          ),
                      ],
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
                            decoration: InputDecoration(
                              labelText: 'Horas',
                              border: const OutlineInputBorder(),
                              isDense: true,
                              errorText:
                                  _validateHours() != null &&
                                      assignment.horas > 0
                                  ? 'Excedido'
                                  : null,
                            ),
                            keyboardType: TextInputType.number,
                            controller: TextEditingController(
                              text: assignment.horas > 0
                                  ? assignment.horas.toString()
                                  : '',
                            ),
                            onChanged: (value) {
                              setState(() {
                                assignment.horas = int.tryParse(value) ?? 0;
                              });
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

  Widget _buildHoursSummary() {
    final allocation = _hoursAllocation.firstWhere(
      (a) => a.tipo == _selectedTipo,
    );

    final remainingAfterAssignment =
        allocation.availableHoras - _totalAssignedHours;
    final isOverAllocated = remainingAfterAssignment < 0;

    return Card(
      color: isOverAllocated ? Colors.red.shade50 : Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Resumo de Horas - ${allocation.displayName}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            _buildHoursRow('Total:', '${allocation.totalHoras}h'),
            _buildHoursRow('Já alocadas:', '${allocation.allocatedHoras}h'),
            _buildHoursRow('Disponíveis:', '${allocation.availableHoras}h'),
            const Divider(height: 16),
            _buildHoursRow(
              'A atribuir agora:',
              '${_totalAssignedHours}h',
              color: isOverAllocated ? Colors.red : Colors.blue,
            ),
            _buildHoursRow(
              'Restantes após atribuição:',
              '${remainingAfterAssignment}h',
              color: isOverAllocated
                  ? Colors.red
                  : remainingAfterAssignment == 0
                  ? Colors.green
                  : Colors.orange,
            ),
            if (isOverAllocated)
              const Padding(
                padding: EdgeInsets.only(top: 8.0),
                child: Row(
                  children: [
                    Icon(Icons.error, color: Colors.red, size: 16),
                    SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Horas excedidas! Reduza a atribuição.',
                        style: TextStyle(color: Colors.red, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            if (remainingAfterAssignment > 0)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Row(
                  children: [
                    const Icon(Icons.warning, color: Colors.orange, size: 16),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Atenção: ${remainingAfterAssignment}h ainda não alocadas',
                        style: const TextStyle(
                          color: Colors.orange,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHoursRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: color)),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  String _getTipoLabel(UCHorasAllocationModel allocation) {
    return '${allocation.displayName} (${allocation.availableHoras}h disponíveis)';
  }
}

class _TeacherAssignment {
  int? docenteId;
  String? docenteNome;
  int horas;

  _TeacherAssignment({this.docenteId, this.docenteNome, this.horas = 0});
}
