import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/departamento_model.dart';
import '../providers/auth_provider.dart';
import '../providers/departamento_provider.dart';
import '../utils/permission_helper.dart';
import '../widgets/app_navigation_drawer.dart';

class DepartamentosScreen extends StatefulWidget {
  const DepartamentosScreen({super.key});

  @override
  State<DepartamentosScreen> createState() => _DepartamentosScreenState();
}

class _DepartamentosScreenState extends State<DepartamentosScreen> {
  bool _showInactive = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DepartamentoProvider>().loadAll();
    });
  }

  void _showCreateDialog() {
    final nomeController = TextEditingController();
    final siglaController = TextEditingController();

    // Capture provider and UI services from State context before showing dialog
    final provider = context.read<DepartamentoProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Novo Departamento'),
        content: Column(
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
              textInputAction: TextInputAction.done,
              onSubmitted: (_) async {
                final departamento = DepartamentoModel(
                  id: 0,
                  nome: nomeController.text,
                  sigla: siglaController.text,
                  ativo: true,
                );

                final success = await provider.create(departamento);

                if (!mounted) return;

                if (success) {
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Departamento criado com sucesso'),
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
              decoration: const InputDecoration(
                labelText: 'Sigla',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              final departamento = DepartamentoModel(
                id: 0,
                nome: nomeController.text,
                sigla: siglaController.text,
                ativo: true,
              );

              final success = await provider.create(departamento);

              if (!mounted) return;

              if (success) {
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Departamento criado com sucesso'),
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
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Departamentos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<DepartamentoProvider>().loadAll();
            },
          ),
          IconButton(
            icon: Icon(_showInactive ? Icons.visibility : Icons.visibility_off),
            tooltip: _showInactive ? 'Ocultar inativos' : 'Mostrar inativos',
            onPressed: () {
              setState(() {
                _showInactive = !_showInactive;
              });
            },
          ),
        ],
      ),
      drawer: const AppNavigationDrawer(currentRoute: 'departamentos'),
      floatingActionButton: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          return authProvider.canCreate(PermissionHelper.menuDepartments)
              ? FloatingActionButton(
                  onPressed: _showCreateDialog,
                  child: const Icon(Icons.add),
                )
              : const SizedBox.shrink();
        },
      ),
      body: Consumer<DepartamentoProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    provider.errorMessage!,
                    style: const TextStyle(fontSize: 16),
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

          // Filter the list based on _showInactive toggle
          final displayList = _showInactive
              ? provider.departamentos
              : provider.departamentos.where((d) => d.ativo).toList();

          if (displayList.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.business_outlined,
                    size: 64,
                    color: Theme.of(context).disabledColor,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _showInactive
                        ? 'Nenhum departamento encontrado'
                        : 'Nenhum departamento ativo encontrado',
                    style: TextStyle(
                      fontSize: 16,
                      color: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.color?.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _showCreateDialog,
                    icon: const Icon(Icons.add),
                    label: const Text('Criar Primeiro Departamento'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: displayList.length,
            itemBuilder: (itemContext, index) {
              final dept = displayList[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: dept.ativo
                        ? Theme.of(itemContext).primaryColor
                        : Colors.grey,
                    foregroundColor: Colors.white,
                    child: Text(
                      dept.sigla,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(
                    dept.nome,
                    style: TextStyle(
                      decoration: dept.ativo
                          ? null
                          : TextDecoration.lineThrough,
                    ),
                  ),
                  subtitle: Text(dept.ativo ? 'Ativo' : 'Inativo'),
                  trailing: Consumer<AuthProvider>(
                    builder: (context, authProvider, child) {
                      final canEdit = authProvider.canEdit(
                        PermissionHelper.menuDepartments,
                      );
                      final canDelete = authProvider.canDelete(
                        PermissionHelper.menuDepartments,
                      );

                      return PopupMenuButton(
                        itemBuilder: (context) => [
                          if (canEdit)
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
                          if (canEdit && dept.ativo)
                            const PopupMenuItem(
                              value: 'deactivate',
                              child: Row(
                                children: [
                                  Icon(Icons.block),
                                  SizedBox(width: 8),
                                  Text('Inativar'),
                                ],
                              ),
                            ),
                          if (canEdit && !dept.ativo)
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
                          if (canDelete)
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
                            final nomeController = TextEditingController(
                              text: dept.nome,
                            );
                            final siglaController = TextEditingController(
                              text: dept.sigla,
                            );

                            final provider = context
                                .read<DepartamentoProvider>();
                            final messenger = ScaffoldMessenger.of(context);

                            final result = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Editar Departamento'),
                                content: Column(
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
                                      textInputAction: TextInputAction.done,
                                      onSubmitted: (_) =>
                                          Navigator.pop(context, true),
                                      decoration: const InputDecoration(
                                        labelText: 'Sigla',
                                        border: OutlineInputBorder(),
                                      ),
                                    ),
                                  ],
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, false),
                                    child: const Text('Cancelar'),
                                  ),
                                  ElevatedButton(
                                    onPressed: () =>
                                        Navigator.pop(context, true),
                                    child: const Text('Salvar'),
                                  ),
                                ],
                              ),
                            );

                            if (result == true && mounted) {
                              final updatedDept = DepartamentoModel(
                                id: dept.id,
                                nome: nomeController.text,
                                sigla: siglaController.text,
                                ativo: dept.ativo,
                              );

                              final success = await provider.update(
                                dept.id,
                                updatedDept,
                              );
                              if (!mounted) return;
                              if (success) {
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('Departamento atualizado'),
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
                            }
                          } else if (value == 'deactivate') {
                            final provider = context
                                .read<DepartamentoProvider>();
                            final messenger = ScaffoldMessenger.of(context);

                            final success = await provider.deactivate(dept.id);
                            if (!mounted) return;
                            if (success) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Departamento inativado'),
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
                            final provider = context
                                .read<DepartamentoProvider>();
                            final messenger = ScaffoldMessenger.of(context);

                            final updatedDept = DepartamentoModel(
                              id: dept.id,
                              nome: dept.nome,
                              sigla: dept.sigla,
                              ativo: true,
                            );
                            final success = await provider.update(
                              dept.id,
                              updatedDept,
                            );
                            if (!mounted) return;
                            if (success) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Departamento reativado'),
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
                            final provider = context
                                .read<DepartamentoProvider>();
                            final messenger = ScaffoldMessenger.of(context);

                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Confirmar exclusão'),
                                content: Text(
                                  'Deseja realmente excluir o departamento "${dept.nome}"?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, false),
                                    child: const Text('Cancelar'),
                                  ),
                                  ElevatedButton(
                                    onPressed: () =>
                                        Navigator.pop(context, true),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                    ),
                                    child: const Text('Excluir'),
                                  ),
                                ],
                              ),
                            );

                            if (confirm == true && mounted) {
                              final success = await provider.delete(dept.id);
                              if (!mounted) return;
                              if (success) {
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('Departamento excluído'),
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
                            }
                          }
                        },
                      );
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
}
