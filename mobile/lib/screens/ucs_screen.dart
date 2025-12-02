import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/curso_model.dart';
import '../models/uc_model.dart';
import '../providers/area_cientifica_provider.dart';
import '../providers/curso_provider.dart';
import '../providers/uc_provider.dart';
import '../utils/validators.dart';
import '../widgets/app_navigation_drawer.dart';

class UCsScreen extends StatefulWidget {
  const UCsScreen({super.key});

  @override
  State<UCsScreen> createState() => _UCsScreenState();
}

class _UCsScreenState extends State<UCsScreen> {
  bool _showInactive = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UCProvider>().loadAll();
      context.read<CursoProvider>().loadAll();
      context.read<AreaCientificaProvider>().loadAll();
    });
  }

  void _showCreateDialog() {
    final nomeController = TextEditingController();
    final anoCursoController = TextEditingController();
    final ectsController = TextEditingController();
    int? selectedCursoId;
    int? selectedAreaId;
    int selectedSemestre = 1;

    final formKey = GlobalKey<FormState>();

    // Capture BEFORE showDialog
    final ucProvider = context.read<UCProvider>();
    final cursoProvider = context.read<CursoProvider>();
    final areaProvider = context.read<AreaCientificaProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Nova Unidade Curricular'),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Nome
                  TextFormField(
                    controller: nomeController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Nome',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) =>
                        Validators.validateRequired(value, 'Nome'),
                  ),
                  const SizedBox(height: 16),

                  // Curso Dropdown
                  DropdownButtonFormField<int>(
                    initialValue: selectedCursoId,
                    decoration: const InputDecoration(
                      labelText: 'Curso',
                      border: OutlineInputBorder(),
                    ),
                    items: cursoProvider.cursos
                        .where((c) => c.ativo)
                        .map(
                          (curso) => DropdownMenuItem(
                            value: curso.id,
                            child: Text('${curso.sigla} - ${curso.nome}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedCursoId = value;
                      });
                    },
                    validator: (value) {
                      if (value == null) {
                        return 'Curso é obrigatório';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Area Dropdown
                  DropdownButtonFormField<int>(
                    initialValue: selectedAreaId,
                    decoration: const InputDecoration(
                      labelText: 'Área Científica',
                      border: OutlineInputBorder(),
                    ),
                    items: areaProvider.areas
                        .where((a) => a.ativo)
                        .map(
                          (area) => DropdownMenuItem(
                            value: area.id,
                            child: Text('${area.sigla} - ${area.nome}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedAreaId = value;
                      });
                    },
                    validator: (value) {
                      if (value == null) {
                        return 'Área Científica é obrigatória';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Ano Curso
                  TextFormField(
                    controller: anoCursoController,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Ano do Curso',
                      border: OutlineInputBorder(),
                      hintText: '1-10',
                    ),
                    validator: (value) {
                      final error = Validators.validateNumeric(value, 'Ano');
                      if (error != null) return error;
                      final ano = int.parse(value!);
                      if (ano < 1 || ano > 10) {
                        return 'Ano deve estar entre 1 e 10';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Semestre (Radio buttons)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Semestre',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      RadioGroup<int>(
                        groupValue: selectedSemestre,
                        onChanged: (value) {
                          setState(() {
                            selectedSemestre = value!;
                          });
                        },
                        child: Row(
                          children: [
                            Expanded(
                              child: RadioListTile<int>(
                                title: const Text('1º Semestre'),
                                value: 1,
                              ),
                            ),
                            Expanded(
                              child: RadioListTile<int>(
                                title: const Text('2º Semestre'),
                                value: 2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ECTS
                  TextFormField(
                    controller: ectsController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      labelText: 'ECTS',
                      border: OutlineInputBorder(),
                      hintText: 'Ex: 6.0',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'ECTS é obrigatório';
                      }
                      final ects = double.tryParse(value);
                      if (ects == null) {
                        return 'ECTS deve ser um número';
                      }
                      if (ects < 0) {
                        return 'ECTS deve ser maior ou igual a 0';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => navigator.pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  final uc = UCModel(
                    id: 0,
                    nome: nomeController.text,
                    idCurso: selectedCursoId!,
                    idArea: selectedAreaId!,
                    anoCurso: int.parse(anoCursoController.text),
                    semCurso: selectedSemestre,
                    ects: double.parse(ectsController.text),
                    ativo: true,
                  );

                  final success = await ucProvider.create(uc);

                  if (!mounted) return;

                  if (success) {
                    navigator.pop();
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('UC criada com sucesso'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } else if (ucProvider.errorMessage != null) {
                    messenger.showSnackBar(
                      SnackBar(
                        content: Text(ucProvider.errorMessage!),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              child: const Text('Criar'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditDialog(UCModel uc) {
    final nomeController = TextEditingController(text: uc.nome);
    final anoCursoController = TextEditingController(
      text: uc.anoCurso.toString(),
    );
    final ectsController = TextEditingController(text: uc.ects.toString());
    int? selectedCursoId = uc.idCurso;
    int? selectedAreaId = uc.idArea;
    int selectedSemestre = uc.semCurso;

    final formKey = GlobalKey<FormState>();

    // Capture BEFORE showDialog
    final ucProvider = context.read<UCProvider>();
    final cursoProvider = context.read<CursoProvider>();
    final areaProvider = context.read<AreaCientificaProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Editar Unidade Curricular'),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Nome
                  TextFormField(
                    controller: nomeController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Nome',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) =>
                        Validators.validateRequired(value, 'Nome'),
                  ),
                  const SizedBox(height: 16),

                  // Curso Dropdown
                  DropdownButtonFormField<int>(
                    initialValue: selectedCursoId,
                    decoration: const InputDecoration(
                      labelText: 'Curso',
                      border: OutlineInputBorder(),
                    ),
                    items: cursoProvider.cursos
                        .where((c) => c.ativo)
                        .map(
                          (curso) => DropdownMenuItem(
                            value: curso.id,
                            child: Text('${curso.sigla} - ${curso.nome}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedCursoId = value;
                      });
                    },
                    validator: (value) {
                      if (value == null) {
                        return 'Curso é obrigatório';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Area Dropdown
                  DropdownButtonFormField<int>(
                    initialValue: selectedAreaId,
                    decoration: const InputDecoration(
                      labelText: 'Área Científica',
                      border: OutlineInputBorder(),
                    ),
                    items: areaProvider.areas
                        .where((a) => a.ativo)
                        .map(
                          (area) => DropdownMenuItem(
                            value: area.id,
                            child: Text('${area.sigla} - ${area.nome}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedAreaId = value;
                      });
                    },
                    validator: (value) {
                      if (value == null) {
                        return 'Área Científica é obrigatória';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Ano Curso
                  TextFormField(
                    controller: anoCursoController,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Ano do Curso',
                      border: OutlineInputBorder(),
                      hintText: '1-10',
                    ),
                    validator: (value) {
                      final error = Validators.validateNumeric(value, 'Ano');
                      if (error != null) return error;
                      final ano = int.parse(value!);
                      if (ano < 1 || ano > 10) {
                        return 'Ano deve estar entre 1 e 10';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Semestre (Radio buttons)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Semestre',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      RadioGroup<int>(
                        groupValue: selectedSemestre,
                        onChanged: (value) {
                          setState(() {
                            selectedSemestre = value!;
                          });
                        },
                        child: Row(
                          children: [
                            Expanded(
                              child: RadioListTile<int>(
                                title: const Text('1º Semestre'),
                                value: 1,
                              ),
                            ),
                            Expanded(
                              child: RadioListTile<int>(
                                title: const Text('2º Semestre'),
                                value: 2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ECTS
                  TextFormField(
                    controller: ectsController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      labelText: 'ECTS',
                      border: OutlineInputBorder(),
                      hintText: 'Ex: 6.0',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'ECTS é obrigatório';
                      }
                      final ects = double.tryParse(value);
                      if (ects == null) {
                        return 'ECTS deve ser um número';
                      }
                      if (ects < 0) {
                        return 'ECTS deve ser maior ou igual a 0';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => navigator.pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  final updatedUC = uc.copyWith(
                    nome: nomeController.text,
                    idCurso: selectedCursoId!,
                    idArea: selectedAreaId!,
                    anoCurso: int.parse(anoCursoController.text),
                    semCurso: selectedSemestre,
                    ects: double.parse(ectsController.text),
                  );

                  final success = await ucProvider.update(uc.id, updatedUC);

                  if (!mounted) return;

                  if (success) {
                    navigator.pop();
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('UC atualizada com sucesso'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } else if (ucProvider.errorMessage != null) {
                    messenger.showSnackBar(
                      SnackBar(
                        content: Text(ucProvider.errorMessage!),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              child: const Text('Salvar'),
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
        title: const Text('Unidades Curriculares'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<UCProvider>().loadAll();
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
      drawer: const AppNavigationDrawer(currentRoute: 'ucs'),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
      ),
      body: Consumer<UCProvider>(
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
              ? provider.ucs
              : provider.ucs.where((uc) => uc.ativo).toList();

          if (displayList.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.menu_book_outlined,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _showInactive
                        ? 'Nenhuma UC encontrada'
                        : 'Nenhuma UC ativa encontrada',
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
            itemCount: displayList.length,
            itemBuilder: (itemContext, index) {
              final uc = displayList[index];

              // Get curso and area names
              final curso = context.read<CursoProvider>().cursos.firstWhere(
                (c) => c.id == uc.idCurso,
                orElse: () => CursoModel(
                  id: 0,
                  nome: 'Desconhecido',
                  sigla: '?',
                  tipo: 'T',
                  ativo: false,
                ),
              );

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: uc.ativo
                        ? Theme.of(itemContext).primaryColor
                        : Colors.grey,
                    child: Text(
                      uc.nome.substring(0, 1).toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    uc.nome,
                    style: TextStyle(
                      decoration: uc.ativo ? null : TextDecoration.lineThrough,
                    ),
                  ),
                  subtitle: Text(
                    'Curso: ${curso.sigla} • Ano ${uc.anoCurso} • Sem ${uc.semCurso} • ${uc.ects} ECTS',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
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
                      if (uc.ativo)
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
                        _showEditDialog(uc);
                      } else if (value == 'deactivate') {
                        final provider = context.read<UCProvider>();
                        final messenger = ScaffoldMessenger.of(context);

                        final success = await provider.deactivate(uc.id);
                        if (!mounted) return;
                        if (success) {
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('UC inativada'),
                              backgroundColor: Colors.orange,
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
                        final provider = context.read<UCProvider>();
                        final messenger = ScaffoldMessenger.of(context);

                        final success = await provider.reactivate(uc.id);
                        if (!mounted) return;
                        if (success) {
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('UC reativada'),
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
                        final provider = context.read<UCProvider>();
                        final navigator = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);

                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Confirmar Exclusão'),
                            content: Text(
                              'Tem certeza que deseja excluir a UC "${uc.nome}"?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => navigator.pop(false),
                                child: const Text('Cancelar'),
                              ),
                              ElevatedButton(
                                onPressed: () => navigator.pop(true),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red,
                                ),
                                child: const Text('Excluir'),
                              ),
                            ],
                          ),
                        );

                        if (confirm == true && mounted) {
                          final success = await provider.delete(uc.id);
                          if (!mounted) return;
                          if (success) {
                            messenger.showSnackBar(
                              const SnackBar(
                                content: Text('UC excluída'),
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
}
