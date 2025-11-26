import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/area_cientifica_model.dart';
import '../models/departamento_model.dart';
import '../providers/area_cientifica_provider.dart';
import '../providers/departamento_provider.dart';
import '../widgets/app_navigation_drawer.dart';

class AreasCientificasScreen extends StatefulWidget {
  const AreasCientificasScreen({super.key});

  @override
  State<AreasCientificasScreen> createState() => _AreasCientificasScreenState();
}

class _AreasCientificasScreenState extends State<AreasCientificasScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AreaCientificaProvider>().loadAll();
      context.read<DepartamentoProvider>().loadAll();
    });
  }

  void _showCreateDialog() {
    final nomeController = TextEditingController();
    final siglaController = TextEditingController();
    int? selectedDepartamento;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Nova Área Científica'),
          content: Consumer<DepartamentoProvider>(
            builder: (context, deptProvider, child) {
              final activeDepts = deptProvider.departamentos
                  .where((d) => d.ativo)
                  .toList();

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nomeController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Nome',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: siglaController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Sigla',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<int>(
                    initialValue: selectedDepartamento,
                    decoration: const InputDecoration(
                      labelText: 'Departamento',
                      border: OutlineInputBorder(),
                    ),
                    items: activeDepts.map((dept) {
                      return DropdownMenuItem<int>(
                        value: dept.id,
                        child: Text('${dept.sigla} - ${dept.nome}'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedDepartamento = value;
                      });
                    },
                  ),
                ],
              );
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (selectedDepartamento == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Selecione um departamento'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                  return;
                }

                final area = AreaCientificaModel(
                  id: 0,
                  nome: nomeController.text,
                  sigla: siglaController.text,
                  idDep: selectedDepartamento!,
                  ativo: true,
                );

                final provider = context.read<AreaCientificaProvider>();
                final navigator = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);

                final success = await provider.create(area);

                if (!mounted) return;

                if (success) {
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Área científica criada com sucesso'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else if (provider.errorMessage != null) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(provider.errorMessage!),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              child: const Text('Criar'),
            ),
          ],
        ),
      ),
    );
  }

  String _getDepartamentoNome(int idDep) {
    final deptProvider = context.read<DepartamentoProvider>();
    final dept = deptProvider.departamentos.firstWhere(
      (d) => d.id == idDep,
      orElse: () => DepartamentoModel(
        id: 0,
        nome: 'Desconhecido',
        sigla: '?',
        ativo: false,
      ),
    );
    return dept.sigla;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Áreas Científicas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<AreaCientificaProvider>().loadAll();
              context.read<DepartamentoProvider>().loadAll();
            },
          ),
        ],
      ),
      drawer: const AppNavigationDrawer(currentRoute: 'areas_cientificas'),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
      ),
      body: Consumer<AreaCientificaProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    'Erro: ${provider.errorMessage}',
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadAll(),
                    child: const Text('Tentar Novamente'),
                  ),
                ],
              ),
            );
          }

          if (provider.areas.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.science_outlined,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Nenhuma área científica encontrada',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Clique no botão + para adicionar',
                    style: TextStyle(color: Colors.grey[500]),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.areas.length,
            itemBuilder: (itemContext, index) {
              final area = provider.areas[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: area.ativo
                        ? Theme.of(itemContext).primaryColor
                        : Colors.grey,
                    child: Text(
                      area.sigla,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    area.nome,
                    style: TextStyle(
                      decoration: area.ativo
                          ? null
                          : TextDecoration.lineThrough,
                    ),
                  ),
                  subtitle: Text(
                    '${area.ativo ? 'Ativo' : 'Inativo'} • Dept: ${_getDepartamentoNome(area.idDep)}',
                  ),
                  trailing: PopupMenuButton(
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit),
                            SizedBox(width: 8),
                            Text('Editar'),
                          ],
                        ),
                      ),
                      if (area.ativo)
                        const PopupMenuItem(
                          value: 'deactivate',
                          child: Row(
                            children: [
                              Icon(Icons.block),
                              SizedBox(width: 8),
                              Text('Inativar'),
                            ],
                          ),
                        )
                      else
                        const PopupMenuItem(
                          value: 'reactivate',
                          child: Row(
                            children: [
                              Icon(Icons.check_circle, color: Colors.green),
                              SizedBox(width: 8),
                              Text(
                                'Reativar',
                                style: TextStyle(color: Colors.green),
                              ),
                            ],
                          ),
                        ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, color: Colors.red),
                            SizedBox(width: 8),
                            Text(
                              'Excluir',
                              style: TextStyle(color: Colors.red),
                            ),
                          ],
                        ),
                      ),
                    ],
                    onSelected: (value) async {
                      if (value == 'edit') {
                        _showEditDialog(area);
                      } else if (value == 'deactivate') {
                        final provider = context.read<AreaCientificaProvider>();
                        final messenger = ScaffoldMessenger.of(context);

                        final success = await provider.deactivate(area.id);
                        if (!mounted) return;
                        if (success) {
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('Área científica inativada'),
                            ),
                          );
                        } else if (provider.errorMessage != null) {
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(provider.errorMessage!),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      } else if (value == 'reactivate') {
                        final provider = context.read<AreaCientificaProvider>();
                        final messenger = ScaffoldMessenger.of(context);

                        final updatedArea = area.copyWith(ativo: true);
                        final success = await provider.update(
                          area.id,
                          updatedArea,
                        );
                        if (!mounted) return;
                        if (success) {
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('Área científica reativada'),
                              backgroundColor: Colors.green,
                            ),
                          );
                        } else if (provider.errorMessage != null) {
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(provider.errorMessage!),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      } else if (value == 'delete') {
                        final provider = context.read<AreaCientificaProvider>();
                        final messenger = ScaffoldMessenger.of(context);

                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Confirmar exclusão'),
                            content: Text(
                              'Deseja realmente excluir a área científica "${area.nome}"?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancelar'),
                              ),
                              ElevatedButton(
                                onPressed: () => Navigator.pop(context, true),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red,
                                ),
                                child: const Text('Excluir'),
                              ),
                            ],
                          ),
                        );

                        if (confirm == true && mounted) {
                          final success = await provider.delete(area.id);
                          if (!mounted) return;
                          if (success) {
                            messenger.showSnackBar(
                              const SnackBar(
                                content: Text('Área científica excluída'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          } else if (provider.errorMessage != null) {
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(provider.errorMessage!),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      }
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showEditDialog(AreaCientificaModel area) {
    final nomeController = TextEditingController(text: area.nome);
    final siglaController = TextEditingController(text: area.sigla);
    int? selectedDepartamento = area.idDep;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Editar Área Científica'),
          content: Consumer<DepartamentoProvider>(
            builder: (context, deptProvider, child) {
              final activeDepts = deptProvider.departamentos
                  .where((d) => d.ativo)
                  .toList();

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nomeController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Nome',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: siglaController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Sigla',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<int>(
                    initialValue: selectedDepartamento,
                    decoration: const InputDecoration(
                      labelText: 'Departamento',
                      border: OutlineInputBorder(),
                    ),
                    items: activeDepts.map((dept) {
                      return DropdownMenuItem<int>(
                        value: dept.id,
                        child: Text('${dept.sigla} - ${dept.nome}'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedDepartamento = value;
                      });
                    },
                  ),
                ],
              );
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (selectedDepartamento == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Selecione um departamento'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                  return;
                }

                final updatedArea = AreaCientificaModel(
                  id: area.id,
                  nome: nomeController.text,
                  sigla: siglaController.text,
                  idDep: selectedDepartamento!,
                  ativo: area.ativo,
                );

                final provider = context.read<AreaCientificaProvider>();
                final navigator = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);

                final success = await provider.update(area.id, updatedArea);

                if (!mounted) return;

                if (success) {
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Área científica atualizada'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else if (provider.errorMessage != null) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(provider.errorMessage!),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              child: const Text('Salvar'),
            ),
          ],
        ),
      ),
    );
  }
}
