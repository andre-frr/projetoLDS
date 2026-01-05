import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/dsd_model.dart';
import '../providers/dsd_provider.dart';

class DsdScreen extends StatefulWidget {
  const DsdScreen({super.key});

  @override
  State<DsdScreen> createState() => _DsdScreenState();
}

class _DsdScreenState extends State<DsdScreen> {
  DsdModel? _selectedDsd;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDsds();
    });
  }

  Future<void> _loadDsds() async {
    final dsdProvider = context.read<DsdProvider>();

    // Load DSDs - backend will filter based on role
    await dsdProvider.loadAll();
  }

  @override
  Widget build(BuildContext context) {
    final dsdProvider = context.watch<DsdProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Distribuição de Serviço Docente'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadDsds),
        ],
      ),
      body: dsdProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : dsdProvider.errorMessage != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Erro: ${dsdProvider.errorMessage}',
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadDsds,
                    child: const Text('Tentar Novamente'),
                  ),
                ],
              ),
            )
          : dsdProvider.dsds.isEmpty
          ? const Center(
              child: Text('Nenhuma distribuição de serviço encontrada'),
            )
          : Column(
              children: [
                // Dropdown to select DSD
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: DropdownButtonFormField<DsdModel>(
                    decoration: const InputDecoration(
                      labelText: 'Selecionar DSD',
                      border: OutlineInputBorder(),
                    ),
                    initialValue: _selectedDsd,
                    items: dsdProvider.dsds.map((dsd) {
                      return DropdownMenuItem<DsdModel>(
                        value: dsd,
                        child: Text(dsd.displayName),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedDsd = value;
                      });
                    },
                  ),
                ),

                // Display selected DSD details
                if (_selectedDsd != null)
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _selectedDsd!.ucNome ?? 'UC',
                                style: Theme.of(
                                  context,
                                ).textTheme.headlineSmall,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _selectedDsd!.cursoNome ?? '',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const Divider(height: 32),
                              _buildDetailRow(
                                'Ano Letivo',
                                _selectedDsd!.yearDisplay,
                              ),
                              _buildDetailRow('Turma', _selectedDsd!.turma),
                              _buildDetailRow(
                                'Tipo de Horas',
                                _getTipoDescription(_selectedDsd!.tipo),
                              ),
                              _buildDetailRow(
                                'Horas Atribuídas',
                                '${_selectedDsd!.horas}h',
                              ),
                              if (_selectedDsd!.docenteNome != null)
                                _buildDetailRow(
                                  'Docente',
                                  _selectedDsd!.docenteNome!,
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 150,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  String _getTipoDescription(String tipo) {
    switch (tipo) {
      case 'PL':
        return 'PL - Prática Laboratorial';
      case 'T':
        return 'T - Teórica';
      case 'TP':
        return 'TP - Teórico-Prática';
      case 'OT':
        return 'OT - Outra';
      default:
        return tipo;
    }
  }
}
