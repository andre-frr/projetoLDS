import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/coordinator_provider.dart';
import '../providers/curso_provider.dart';
import '../providers/departamento_provider.dart';
import '../services/coordinator_service.dart';

class CoordinatorAssignmentsScreen extends StatefulWidget {
  const CoordinatorAssignmentsScreen({super.key});

  @override
  State<CoordinatorAssignmentsScreen> createState() =>
      _CoordinatorAssignmentsScreenState();
}

class _CoordinatorAssignmentsScreenState
    extends State<CoordinatorAssignmentsScreen> {
  int? _selectedCoordinatorId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final coordProvider = context.read<CoordinatorProvider>();
    final deptProvider = context.read<DepartamentoProvider>();
    final courseProvider = context.read<CursoProvider>();

    await Future.wait([
      coordProvider.loadCoordinators(),
      deptProvider.loadAll(),
      courseProvider.loadAll(),
    ]);
  }

  Future<void> _showAssignDepartmentDialog() async {
    if (_selectedCoordinatorId == null) return;

    final deptProvider = context.read<DepartamentoProvider>();
    final coordProvider = context.read<CoordinatorProvider>();

    // Get departments not yet assigned
    final assignedDepts =
        coordProvider.selectedAssignment?.departments
            .map((d) => d.id)
            .toSet() ??
        {};
    final availableDepts = deptProvider.departamentos.where(
      (d) => !assignedDepts.contains(d.id),
    );

    if (availableDepts.isEmpty && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Todos os departamentos já foram atribuídos'),
        ),
      );
      return;
    }

    final selectedDept = await showDialog<int>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selecionar Departamento'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: availableDepts.length,
            itemBuilder: (context, index) {
              final dept = availableDepts.elementAt(index);
              return ListTile(
                title: Text(dept.nome),
                subtitle: Text(dept.sigla),
                onTap: () => Navigator.of(context).pop(dept.id),
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

    if (selectedDept != null && mounted) {
      final success = await coordProvider.assignToDepartment(
        _selectedCoordinatorId!,
        selectedDept,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? 'Departamento atribuído com sucesso'
                  : coordProvider.errorMessage ??
                        'Erro ao atribuir departamento',
            ),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _showAssignCourseDialog() async {
    if (_selectedCoordinatorId == null) return;

    final courseProvider = context.read<CursoProvider>();
    final coordProvider = context.read<CoordinatorProvider>();

    // Get courses not yet assigned
    final assignedCourses =
        coordProvider.selectedAssignment?.courses.map((c) => c.id).toSet() ??
        {};
    final availableCourses = courseProvider.cursos.where(
      (c) => c.ativo && !assignedCourses.contains(c.id),
    );

    if (availableCourses.isEmpty && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Todos os cursos já foram atribuídos')),
      );
      return;
    }

    final selectedCourse = await showDialog<int>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selecionar Curso'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: availableCourses.length,
            itemBuilder: (context, index) {
              final course = availableCourses.elementAt(index);
              return ListTile(
                title: Text(course.nome),
                subtitle: Text(course.sigla),
                onTap: () => Navigator.of(context).pop(course.id),
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

    if (selectedCourse != null && mounted) {
      final success = await coordProvider.assignToCourse(
        _selectedCoordinatorId!,
        selectedCourse,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? 'Curso atribuído com sucesso'
                  : coordProvider.errorMessage ?? 'Erro ao atribuir curso',
            ),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _confirmRemoveDepartment(Department dept) async {
    if (_selectedCoordinatorId == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Remoção'),
        content: Text(
          'Tem a certeza que deseja remover o departamento "${dept.nome}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Remover'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final coordProvider = context.read<CoordinatorProvider>();
      final success = await coordProvider.removeFromDepartment(
        _selectedCoordinatorId!,
        dept.id,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? 'Departamento removido com sucesso'
                  : coordProvider.errorMessage ??
                        'Erro ao remover departamento',
            ),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _confirmRemoveCourse(Course course) async {
    if (_selectedCoordinatorId == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Remoção'),
        content: Text(
          'Tem a certeza que deseja remover o curso "${course.nome}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Remover'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final coordProvider = context.read<CoordinatorProvider>();
      final success = await coordProvider.removeFromCourse(
        _selectedCoordinatorId!,
        course.id,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? 'Curso removido com sucesso'
                  : coordProvider.errorMessage ?? 'Erro ao remover curso',
            ),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final coordProvider = context.watch<CoordinatorProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Atribuições de Coordenadores'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: coordProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : coordProvider.coordinators.isEmpty
          ? const Center(child: Text('Nenhum coordenador encontrado'))
          : Column(
              children: [
                // Coordinator selector
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: DropdownButtonFormField<int>(
                    decoration: const InputDecoration(
                      labelText: 'Selecionar Coordenador',
                      border: OutlineInputBorder(),
                    ),
                    items: coordProvider.coordinators.map((coord) {
                      return DropdownMenuItem<int>(
                        value: coord['id'],
                        child: Text(coord['email']),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _selectedCoordinatorId = value;
                        });
                        coordProvider.loadAssignments(value);
                      }
                    },
                  ),
                ),

                // Assignments display
                if (_selectedCoordinatorId != null &&
                    coordProvider.selectedAssignment != null)
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Departments section
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Departamentos',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle),
                                color: Colors.blue,
                                onPressed: _showAssignDepartmentDialog,
                                tooltip: 'Adicionar Departamento',
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (coordProvider
                              .selectedAssignment!
                              .departments
                              .isEmpty)
                            const Card(
                              child: Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Text(
                                  'Nenhum departamento atribuído',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            )
                          else
                            ...coordProvider.selectedAssignment!.departments
                                .map(
                                  (dept) => Card(
                                    child: ListTile(
                                      leading: const Icon(
                                        Icons.business,
                                        color: Colors.blue,
                                      ),
                                      title: Text(dept.nome),
                                      subtitle: Text(dept.sigla),
                                      trailing: IconButton(
                                        icon: const Icon(
                                          Icons.delete,
                                          color: Colors.red,
                                        ),
                                        onPressed: () =>
                                            _confirmRemoveDepartment(dept),
                                      ),
                                    ),
                                  ),
                                ),

                          const SizedBox(height: 24),

                          // Courses section
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Cursos',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle),
                                color: Colors.blue,
                                onPressed: _showAssignCourseDialog,
                                tooltip: 'Adicionar Curso',
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (coordProvider.selectedAssignment!.courses.isEmpty)
                            const Card(
                              child: Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Text(
                                  'Nenhum curso atribuído',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            )
                          else
                            ...coordProvider.selectedAssignment!.courses.map(
                              (course) => Card(
                                child: ListTile(
                                  leading: const Icon(
                                    Icons.school,
                                    color: Colors.green,
                                  ),
                                  title: Text(course.nome),
                                  subtitle: Text(course.sigla),
                                  trailing: IconButton(
                                    icon: const Icon(
                                      Icons.delete,
                                      color: Colors.red,
                                    ),
                                    onPressed: () =>
                                        _confirmRemoveCourse(course),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
