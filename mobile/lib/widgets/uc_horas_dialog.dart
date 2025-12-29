import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/uc_model.dart';
import '../providers/uc_provider.dart';

class UCHorasDialog extends StatefulWidget {
  final UCModel uc;

  const UCHorasDialog({super.key, required this.uc});

  @override
  State<UCHorasDialog> createState() => _UCHorasDialogState();
}

class _UCHorasDialogState extends State<UCHorasDialog> {
  bool _isLoading = true;
  final Map<String, TextEditingController> _controllers = {
    'T': TextEditingController(text: '0'),
    'TP': TextEditingController(text: '0'),
    'PL': TextEditingController(text: '0'),
    'OT': TextEditingController(text: '0'),
  };
  late final TextEditingController _horasPerCreditController;

  @override
  void initState() {
    super.initState();
    _horasPerCreditController = TextEditingController(
      text: widget.uc.horasPorEcts.toString(),
    );
    _loadHoras();
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    _horasPerCreditController.dispose();
    super.dispose();
  }

  Future<void> _loadHoras() async {
    final provider = context.read<UCProvider>();
    final horas = await provider.getHoras(widget.uc.id);

    if (!mounted) return;

    setState(() {
      for (var h in horas) {
        if (_controllers.containsKey(h.tipo)) {
          _controllers[h.tipo]!.text = h.horas.toString();
        }
      }
      _isLoading = false;
    });
  }

  int get _totalHoras {
    final horasPerCredit = int.tryParse(_horasPerCreditController.text.trim());
    return (widget.uc.ects * (horasPerCredit ?? 28)).round();
  }

  int get _contactHoras {
    int total = 0;
    for (var controller in _controllers.values) {
      total += int.tryParse(controller.text) ?? 0;
    }
    return total;
  }

  int get _autonomousHoras => _totalHoras - _contactHoras;

  Future<void> _save() async {
    setState(() => _isLoading = true);

    final provider = context.read<UCProvider>();
    bool success = true;

    // Update hours per ECTS if changed
    final newHorasPorEcts = int.tryParse(_horasPerCreditController.text) ?? 28;
    if (newHorasPorEcts != widget.uc.horasPorEcts) {
      final result = await provider.updateHorasPorEcts(
        widget.uc.id,
        newHorasPorEcts,
      );
      if (!result) success = false;
    }

    // Update all hour types (including 0 values) to ensure database is in sync
    for (var entry in _controllers.entries) {
      final horas = int.tryParse(entry.value.text) ?? 0;
      final result = await provider.updateHoras(widget.uc.id, entry.key, horas);
      if (!result) success = false;
    }

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (success) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Horas atualizadas com sucesso'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Erro ao atualizar horas'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final autonomousPercent = _totalHoras > 0
        ? (_autonomousHoras / _totalHoras).clamp(0.0, 1.0)
        : 0.0;
    final contactPercent = _totalHoras > 0
        ? (_contactHoras / _totalHoras).clamp(0.0, 1.0)
        : 0.0;

    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: AlertDialog(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Gerir Horas - ${widget.uc.nome}',
                overflow: TextOverflow.ellipsis,
                maxLines: 2,
              ),
              Text(
                '${widget.uc.ects} ECTS = $_totalHoras Horas Totais',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Dashboard
                        Card(
                          color: Colors.blue.shade50,
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildStat(
                                      'Contacto',
                                      '$_contactHoras h',
                                      Colors.blue,
                                    ),
                                    _buildStat(
                                      'Autónomo',
                                      '$_autonomousHoras h',
                                      Colors.green,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: SizedBox(
                                    height: 12,
                                    child: Row(
                                      children: [
                                        if (contactPercent > 0)
                                          Expanded(
                                            flex: (contactPercent * 100)
                                                .toInt(),
                                            child: Container(
                                              color: Colors.blue,
                                            ),
                                          ),
                                        if (autonomousPercent > 0)
                                          Expanded(
                                            flex: (autonomousPercent * 100)
                                                .toInt(),
                                            child: Container(
                                              color: Colors.green,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Hours per credit input
                        TextField(
                          controller: _horasPerCreditController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Horas de trabalho por ECTS',
                            hintText: '28 (padrão)',
                            border: OutlineInputBorder(),
                            helperText:
                                'Deixe vazio para usar 28 horas por defeito',
                            helperMaxLines: 2,
                          ),
                          onChanged: (_) => setState(() {}),
                        ),
                        const SizedBox(height: 24),
                        const Divider(),
                        const SizedBox(height: 16),
                        const Text(
                          'Horas de Contacto',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Inputs
                        for (var entry in _controllers.entries)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16.0),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 50,
                                  child: Text(
                                    entry.key,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: TextField(
                                    controller: entry.value,
                                    keyboardType: TextInputType.number,
                                    decoration: const InputDecoration(
                                      labelText: 'Horas',
                                      border: OutlineInputBorder(),
                                      isDense: true,
                                    ),
                                    onChanged: (value) {
                                      // Prevent negative values
                                      final parsed = int.tryParse(value);
                                      if (parsed != null && parsed < 0) {
                                        entry.value.text = '0';
                                        entry.value.selection =
                                            TextSelection.fromPosition(
                                              TextPosition(
                                                offset: entry.value.text.length,
                                              ),
                                            );
                                      }
                                      setState(() {});
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: _isLoading ? null : _save,
              child: const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(color: color.withValues(alpha: 0.8), fontSize: 12),
        ),
      ],
    );
  }
}
