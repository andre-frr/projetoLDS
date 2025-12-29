import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/curso_model.dart';
import '../models/uc_model.dart';
import '../providers/area_cientifica_provider.dart';
import '../providers/curso_provider.dart';
import '../providers/uc_provider.dart';
import '../utils/validators.dart';
import '../widgets/app_navigation_drawer.dart';
import '../widgets/uc_horas_dialog.dart';

class UCsScreen extends StatefulWidget {
  const UCsScreen({super.key});

  @override
  State<UCsScreen> createState() => _UCsScreenState();
}

class _UCsScreenState extends State<UCsScreen> {
  bool _showInactive = true;
  int? _filterCursoId;
  int? _filterAno;
  int? _filterSemestre;

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
      body: Column(
        children: [
          // Filter Bar
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? Theme.of(context).colorScheme.surface
                  : Colors.grey[100],
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context).dividerColor,
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                // Curso filter
                Expanded(
                  flex: 2,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Curso',
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        value: _filterCursoId,
                        isDense: true,
                        items: [
                          const DropdownMenuItem<int>(
                            value: null,
                            child: Text('Todos'),
                          ),
                          ...context
                              .watch<CursoProvider>()
                              .cursos
                              .where((c) => c.ativo)
                              .map(
                                (curso) => DropdownMenuItem<int>(
                                  value: curso.id,
                                  child: Text(curso.sigla),
                                ),
                              ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _filterCursoId = value;
                          });
                        },
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Ano filter
                SizedBox(
                  width: 90,
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: 'Ano',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      border: const OutlineInputBorder(),
                      enabled: _filterSemestre == null,
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        value: _filterAno,
                        isDense: true,
                        items: [
                          const DropdownMenuItem<int>(
                            value: null,
                            child: Text('Todos'),
                          ),
                          ...List.generate(
                            3,
                            (index) => DropdownMenuItem<int>(
                              value: index + 1,
                              child: Text('${index + 1}º'),
                            ),
                          ),
                        ],
                        onChanged: _filterSemestre == null
                            ? (value) {
                                setState(() {
                                  _filterAno = value;
                                  // Clear semester when year is selected
                                  if (value != null) {
                                    _filterSemestre = null;
                                  }
                                });
                              }
                            : null,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Semestre filter
                SizedBox(
                  width: 100,
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: 'Sem',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      border: const OutlineInputBorder(),
                      enabled: _filterAno == null,
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        value: _filterSemestre,
                        isDense: true,
                        items: [
                          const DropdownMenuItem<int>(
                            value: null,
                            child: Text('Todos'),
                          ),
                          ...List.generate(
                            6,
                            (index) => DropdownMenuItem<int>(
                              value: index + 1,
                              child: Text('${index + 1}º'),
                            ),
                          ),
                        ],
                        onChanged: _filterAno == null
                            ? (value) {
                                setState(() {
                                  _filterSemestre = value;
                                  // Clear year when semester is selected
                                  if (value != null) {
                                    _filterAno = null;
                                  }
                                });
                              }
                            : null,
                      ),
                    ),
                  ),
                ),
                // Clear filters button
                if (_filterCursoId != null ||
                    _filterAno != null ||
                    _filterSemestre != null)
                  IconButton(
                    icon: const Icon(Icons.clear),
                    tooltip: 'Limpar filtros',
                    onPressed: () {
                      setState(() {
                        _filterCursoId = null;
                        _filterAno = null;
                        _filterSemestre = null;
                      });
                    },
                  ),
              ],
            ),
          ),
          // UC List
          Expanded(
            child: Consumer<UCProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (provider.errorMessage != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red,
                        ),
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

                // Filter the list based on all active filters
                var displayList = provider.ucs;

                // Hide inactive filter
                if (!_showInactive) {
                  displayList = displayList.where((uc) => uc.ativo).toList();
                }

                // Curso filter
                if (_filterCursoId != null) {
                  displayList = displayList
                      .where((uc) => uc.idCurso == _filterCursoId)
                      .toList();
                }

                // Ano filter
                if (_filterAno != null) {
                  displayList = displayList
                      .where((uc) => uc.anoCurso == _filterAno)
                      .toList();
                }

                // Semestre filter (cumulative: semester 1-2 = year 1, 3-4 = year 2, 5-6 = year 3)
                if (_filterSemestre != null) {
                  // Calculate which year and semester within year based on cumulative semester
                  final targetYear =
                      ((_filterSemestre! - 1) ~/ 2) +
                      1; // 1-2 -> 1, 3-4 -> 2, 5-6 -> 3
                  final targetSem =
                      ((_filterSemestre! - 1) % 2) +
                      1; // 1,3,5 -> 1; 2,4,6 -> 2

                  displayList = displayList
                      .where(
                        (uc) =>
                            uc.anoCurso == targetYear &&
                            uc.semCurso == targetSem,
                      )
                      .toList();
                }

                if (displayList.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.menu_book_outlined,
                          size: 64,
                          color: Theme.of(context).disabledColor,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _showInactive
                              ? 'Nenhuma UC encontrada'
                              : 'Nenhuma UC ativa encontrada',
                          style: TextStyle(
                            fontSize: 18,
                            color: Theme.of(context).textTheme.bodyMedium?.color
                                ?.withValues(alpha: 0.6),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Clique no botão + para adicionar',
                          style: TextStyle(
                            color: Theme.of(context).textTheme.bodySmall?.color
                                ?.withValues(alpha: 0.5),
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
                    final uc = displayList[index];

                    // Get curso and area names
                    final curso = context
                        .read<CursoProvider>()
                        .cursos
                        .firstWhere(
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
                          foregroundColor: Colors.white,
                          child: Text(
                            uc.nome.substring(0, 1).toUpperCase(),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        title: Text(
                          uc.nome,
                          style: TextStyle(
                            decoration: uc.ativo
                                ? null
                                : TextDecoration.lineThrough,
                          ),
                        ),
                        subtitle: Text(
                          'Curso: ${curso.sigla} • Ano ${uc.anoCurso} • Sem ${uc.semCurso} • ${uc.ects} ECTS',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(
                              itemContext,
                            ).textTheme.bodySmall?.color,
                          ),
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
                            const PopupMenuItem(
                              value: 'horas',
                              child: Row(
                                children: [
                                  Icon(Icons.access_time),
                                  SizedBox(width: 8),
                                  Text('Gerir Horas'),
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
                                    Icon(
                                      Icons.check_circle,
                                      color: Colors.green,
                                    ),
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
                            } else if (value == 'horas') {
                              showDialog(
                                context: context,
                                builder: (context) => UCHorasDialog(uc: uc),
                              );
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
          ),
        ],
      ),
    );
  }
}
