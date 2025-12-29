import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/curso_model.dart';
import '../providers/auth_provider.dart';
import '../providers/curso_provider.dart';
import '../utils/permission_helper.dart';
import '../widgets/app_navigation_drawer.dart';

class CursosScreen extends StatefulWidget {
  const CursosScreen({super.key});

  @override
  State<CursosScreen> createState() => _CursosScreenState();
}

class _CursosScreenState extends State<CursosScreen> {
  bool _showInactive = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CursoProvider>().loadAll();
    });
  }

  void _showCreateDialog() {
    final nomeController = TextEditingController();
    final siglaController = TextEditingController();
    String? selectedTipo;

    // Capture provider and UI services from State context before showing dialog
    final provider = context.read<CursoProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Novo Curso'),
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
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Sigla',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: selectedTipo,
                decoration: const InputDecoration(
                  labelText: 'Tipo',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'TeSP',
                    child: Text('Técnico Superior Profissional'),
                  ),
                  DropdownMenuItem(value: 'LIC', child: Text('Licenciatura')),
                  DropdownMenuItem(value: 'MEST', child: Text('Mestrado')),
                  DropdownMenuItem(value: 'DOUT', child: Text('Doutoramento')),
                ],
                onChanged: (value) {
                  setState(() {
                    selectedTipo = value;
                  });
                },
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
                if (selectedTipo == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Selecione um tipo'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                  return;
                }

                final curso = CursoModel(
                  id: 0,
                  nome: nomeController.text,
                  sigla: siglaController.text,
                  tipo: selectedTipo!,
                  ativo: true,
                );

                final success = await provider.create(curso);

                if (!mounted) return;

                if (success) {
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Curso criado com sucesso'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cursos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<CursoProvider>().loadAll();
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
      drawer: const AppNavigationDrawer(currentRoute: 'cursos'),
      floatingActionButton: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          return authProvider.canCreate(PermissionHelper.menuCourses)
              ? FloatingActionButton(
                  onPressed: _showCreateDialog,
                  child: const Icon(Icons.add),
                )
              : const SizedBox.shrink();
        },
      ),
      body: Consumer<CursoProvider>(
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

          // Filter the list based on _showInactive toggle
          final displayList = _showInactive
              ? provider.cursos
              : provider.cursos.where((c) => c.ativo).toList();

          if (displayList.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.school_outlined,
                    size: 64,
                    color: Theme.of(context).disabledColor,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _showInactive
                        ? 'Nenhum curso encontrado'
                        : 'Nenhum curso ativo encontrado',
                    style: TextStyle(
                      fontSize: 18,
                      color: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.color?.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Clique no botão + para adicionar',
                    style: TextStyle(
                      color: Theme.of(
                        context,
                      ).textTheme.bodySmall?.color?.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: displayList.length,
            itemBuilder: (itemContext, index) {
              final curso = displayList[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: curso.ativo
                        ? Theme.of(itemContext).primaryColor
                        : Colors.grey,
                    foregroundColor: Colors.white,
                    child: Text(
                      curso.sigla,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  title: Text(
                    curso.nome,
                    style: TextStyle(
                      decoration: curso.ativo
                          ? null
                          : TextDecoration.lineThrough,
                    ),
                  ),
                  subtitle: Text(
                    '${curso.ativo ? 'Ativo' : 'Inativo'} • ${curso.tipoNome}',
                  ),
                  trailing: Consumer<AuthProvider>(
                    builder: (context, authProvider, child) {
                      final canEdit = authProvider.canEdit(
                        PermissionHelper.menuCourses,
                      );
                      final canDelete = authProvider.canDelete(
                        PermissionHelper.menuCourses,
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
                          if (canEdit && curso.ativo)
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
                          if (canEdit && !curso.ativo)
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
                            _showEditDialog(curso);
                          } else if (value == 'deactivate') {
                            final provider = context.read<CursoProvider>();
                            final messenger = ScaffoldMessenger.of(context);

                            final success = await provider.deactivate(curso.id);
                            if (!mounted) return;
                            if (success) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Curso inativado'),
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
                            final provider = context.read<CursoProvider>();
                            final messenger = ScaffoldMessenger.of(context);

                            final updatedCurso = curso.copyWith(ativo: true);
                            final success = await provider.update(
                              curso.id,
                              updatedCurso,
                            );
                            if (!mounted) return;
                            if (success) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Curso reativado'),
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
                            final provider = context.read<CursoProvider>();
                            final messenger = ScaffoldMessenger.of(context);

                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Confirmar exclusão'),
                                content: Text(
                                  'Deseja realmente excluir o curso "${curso.nome}"?',
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
                              final success = await provider.delete(curso.id);
                              if (!mounted) return;
                              if (success) {
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('Curso excluído'),
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

  void _showEditDialog(CursoModel curso) {
    final nomeController = TextEditingController(text: curso.nome);
    final siglaController = TextEditingController(text: curso.sigla);
    String? selectedTipo = curso.tipo;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Editar Curso'),
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
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Sigla',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: selectedTipo,
                decoration: const InputDecoration(
                  labelText: 'Tipo',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'TeSP',
                    child: Text('Técnico Superior Profissional'),
                  ),
                  DropdownMenuItem(value: 'LIC', child: Text('Licenciatura')),
                  DropdownMenuItem(value: 'MEST', child: Text('Mestrado')),
                  DropdownMenuItem(value: 'DOUT', child: Text('Doutoramento')),
                ],
                onChanged: (value) {
                  setState(() {
                    selectedTipo = value;
                  });
                },
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
                if (selectedTipo == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Selecione um tipo'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                  return;
                }

                final updatedCurso = CursoModel(
                  id: curso.id,
                  nome: nomeController.text,
                  sigla: siglaController.text,
                  tipo: selectedTipo!,
                  ativo: curso.ativo,
                );

                final provider = context.read<CursoProvider>();
                final navigator = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);

                final success = await provider.update(curso.id, updatedCurso);

                if (!mounted) return;

                if (success) {
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Curso atualizado'),
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
