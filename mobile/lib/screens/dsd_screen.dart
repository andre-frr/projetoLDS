import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/dsd_model.dart';
import '../providers/auth_provider.dart';
import '../providers/curso_provider.dart';
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
  int? _expandedDsdId;

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
    // Step 1: Select course first
    final selectedCourse = await _showCourseSelector();

    if (selectedCourse == null || !mounted) return;

    // Step 2: Select UC from the chosen course
    final selectedUc = await _showUcSelector(selectedCourse);

    if (selectedUc != null && mounted) {
      // Step 3: Show DSD management dialog
      final result = await showDialog(
        context: context,
        builder: (context) => DsdManagementDialog(uc: selectedUc),
      );

      if (result == true) {
        _loadDsds();
      }
    }
  }

  Future<dynamic> _showCourseSelector() async {
    final cursoProvider = context.read<CursoProvider>();

    // Load courses if not already loaded
    if (cursoProvider.cursos.isEmpty) {
      await cursoProvider.loadAll();
    }

    if (!mounted) return null;

    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selecionar Curso'),
        content: SizedBox(
          width: double.maxFinite,
          child: Consumer<CursoProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              final activeCursos = provider.cursos
                  .where((curso) => curso.ativo)
                  .toList();

              if (activeCursos.isEmpty) {
                return const Center(
                  child: Text('Nenhum curso ativo encontrado'),
                );
              }

              return ListView.builder(
                shrinkWrap: true,
                itemCount: activeCursos.length,
                itemBuilder: (context, index) {
                  final curso = activeCursos[index];
                  return ListTile(
                    leading: const Icon(Icons.school),
                    title: Text(curso.nome),
                    subtitle: Text('${curso.sigla} • ${curso.tipoNome}'),
                    onTap: () => Navigator.of(context).pop(curso),
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
  }

  Future<dynamic> _showUcSelector(dynamic selectedCourse) async {
    final ucProvider = context.read<UCProvider>();

    // Load UCs if not already loaded
    if (ucProvider.ucs.isEmpty) {
      await ucProvider.loadAll();
    }

    if (!mounted) return null;

    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Selecionar Unidade Curricular'),
            const SizedBox(height: 4),
            Text(
              selectedCourse.nome,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.grey.shade400
                    : Colors.grey.shade600,
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Consumer<UCProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              // Filter UCs by selected course
              final courseUcs = provider.ucs
                  .where((uc) => uc.ativo && uc.idCurso == selectedCourse.id)
                  .toList();

              // Sort by year and semester
              courseUcs.sort((a, b) {
                final yearCompare = a.anoCurso.compareTo(b.anoCurso);
                if (yearCompare != 0) return yearCompare;
                return a.semCurso.compareTo(b.semCurso);
              });

              if (courseUcs.isEmpty) {
                return const Center(
                  child: Text('Nenhuma UC ativa encontrada para este curso'),
                );
              }

              return ListView.builder(
                shrinkWrap: true,
                itemCount: courseUcs.length,
                itemBuilder: (context, index) {
                  final uc = courseUcs[index];
                  return ListTile(
                    leading: CircleAvatar(
                      radius: 16,
                      child: Text(
                        '${uc.anoCurso}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    title: Text(uc.nome),
                    subtitle: Text(
                      'Ano ${uc.anoCurso} - Semestre ${uc.semCurso} • ${uc.ects} ECTS',
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
            child: const Text('Voltar'),
          ),
        ],
      ),
    );
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
            _expandedDsdId = null;
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
          : ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: dsdProvider.dsds.length,
              itemBuilder: (context, index) {
                final dsd = dsdProvider.dsds[index];
                final isExpanded = _expandedDsdId == dsd.idDsd;

                return _buildDsdCard(dsd, isExpanded, canCreate);
              },
            ),
    );
  }

  Widget _buildDsdCard(DsdModel dsd, bool isExpanded, bool canManage) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      margin: const EdgeInsets.only(bottom: 12.0),
      elevation: isExpanded ? 4 : 1,
      child: InkWell(
        onTap: () {
          setState(() {
            _expandedDsdId = isExpanded ? null : dsd.idDsd;
          });
        },
        borderRadius: BorderRadius.circular(4),
        child: Column(
          children: [
            // Header - always visible
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  // Expand/collapse icon
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: theme.primaryColor,
                  ),
                  const SizedBox(width: 12),

                  // DSD info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dsd.ucNome ?? 'UC',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${dsd.cursoNome ?? ''} • Turma ${dsd.turma} • ${_getTipoDescription(dsd.tipo)}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark
                                ? Colors.grey.shade400
                                : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Total hours badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: theme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${dsd.horas}h',
                      style: TextStyle(
                        color: theme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Expanded details
            if (isExpanded)
              Column(
                children: [
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDetailRow('Ano Letivo', dsd.yearDisplay),
                        _buildDetailRow('Turma', dsd.turma),
                        _buildDetailRow(
                          'Tipo de Horas',
                          _getTipoDescription(dsd.tipo),
                        ),
                        _buildDetailRow('Horas Atribuídas', '${dsd.horas}h'),
                        if (dsd.docenteNome != null)
                          _buildDetailRow('Docente', dsd.docenteNome!),

                        // Actions
                        if (canManage) ...[
                          const SizedBox(height: 16),
                          const Divider(),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              OutlinedButton.icon(
                                onPressed: () => _confirmDelete(dsd),
                                icon: const Icon(Icons.delete, size: 18),
                                label: const Text('Eliminar'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.red,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
          ],
        ),
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
