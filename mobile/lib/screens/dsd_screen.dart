import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/dsd_model.dart';
import '../providers/auth_provider.dart';
import '../providers/dsd_provider.dart';
import '../providers/uc_provider.dart';
import '../utils/permission_helper.dart';
import 'dsd_management_dialog.dart';

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

  Future<void> _showCreateDialog() async {
    final ucProvider = context.read<UCProvider>();

    // Load UCs if not already loaded
    if (ucProvider.ucs.isEmpty) {
      await ucProvider.loadAll();
    }

    if (!mounted) return;

    // Show UC selector dialog
    final selectedUc = await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selecionar Unidade Curricular'),
        content: SizedBox(
          width: double.maxFinite,
          child: Consumer<UCProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              final activeUcs = provider.ucs.where((uc) => uc.ativo).toList();

              return ListView.builder(
                shrinkWrap: true,
                itemCount: activeUcs.length,
                itemBuilder: (context, index) {
                  final uc = activeUcs[index];
                  return ListTile(
                    title: Text(uc.nome),
                    subtitle: Text(
                      'Ano ${uc.anoCurso} - Semestre ${uc.semCurso}',
                    ),
                    onTap: () => Navigator.of(context).pop(uc),
                  );
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
        ],
      ),
    );

    if (selectedUc != null && mounted) {
      // Show DSD management dialog
      final result = await showDialog(
        context: context,
        builder: (context) => DsdManagementDialog(uc: selectedUc),
      );

      if (result == true) {
        _loadDsds();
      }
    }
  }

  Future<void> _confirmDelete(DsdModel dsd) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Eliminação'),
        content: Text(
          'Tem a certeza que deseja eliminar a DSD de ${dsd.ucNome} - ${dsd.turma} (${dsd.tipo})?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final dsdProvider = context.read<DsdProvider>();
      final success = await dsdProvider.delete(dsd.idDsd);

      if (mounted) {
        if (success) {
          setState(() {
            _selectedDsd = null;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('DSD eliminado com sucesso'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(dsdProvider.errorMessage ?? 'Erro ao eliminar DSD'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dsdProvider = context.watch<DsdProvider>();
    final authProvider = context.watch<AuthProvider>();
    final canCreate = authProvider.canCreate(PermissionHelper.menuDSD);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Distribuição de Serviço Docente'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadDsds),
        ],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton(
              onPressed: _showCreateDialog,
              child: const Icon(Icons.add),
            )
          : null,
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
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      _selectedDsd!.ucNome ?? 'UC',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.headlineSmall,
                                    ),
                                  ),
                                  if (canCreate)
                                    PopupMenuButton(
                                      itemBuilder: (context) => [
                                        const PopupMenuItem(
                                          value: 'delete',
                                          child: Row(
                                            children: [
                                              Icon(
                                                Icons.delete,
                                                color: Colors.red,
                                              ),
                                              SizedBox(width: 8),
                                              Text(
                                                'Eliminar',
                                                style: TextStyle(
                                                  color: Colors.red,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                      onSelected: (value) {
                                        if (value == 'delete') {
                                          _confirmDelete(_selectedDsd!);
                                        }
                                      },
                                    ),
                                ],
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
