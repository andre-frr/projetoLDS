import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/ano_letivo_model.dart';
import '../providers/ano_letivo_provider.dart';
import '../widgets/app_navigation_drawer.dart';

class AnosLetivosScreen extends StatefulWidget {
  const AnosLetivosScreen({super.key});

  @override
  State<AnosLetivosScreen> createState() => _AnosLetivosScreenState();
}

class _AnosLetivosScreenState extends State<AnosLetivosScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AnoLetivoProvider>().loadAll();
      context.read<AnoLetivoProvider>().loadCurrent();
    });
  }

  void _showCreateDialog({bool isNewYear = false}) {
    final anoInicioController = TextEditingController();
    final anoFimController = TextEditingController();

    // Pre-fill with next year if creating a new school year
    if (isNewYear) {
      final provider = context.read<AnoLetivoProvider>();
      if (provider.currentYear != null) {
        anoInicioController.text = (provider.currentYear!.anoFim).toString();
        anoFimController.text = (provider.currentYear!.anoFim + 1).toString();
      } else {
        final currentYear = DateTime.now().year;
        anoInicioController.text = currentYear.toString();
        anoFimController.text = (currentYear + 1).toString();
      }
    }

    final provider = context.read<AnoLetivoProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          isNewYear ? 'Novo Ano Letivo (Limpar Dados)' : 'Adicionar Ano Letivo',
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isNewYear) ...[
              const Icon(Icons.warning, color: Colors.orange, size: 48),
              const SizedBox(height: 16),
              const Text(
                'Criar um novo ano letivo irá iniciar um novo ciclo. '
                'Os dados do ano anterior serão preservados para consulta histórica.',
                style: TextStyle(fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
            ],
            TextField(
              controller: anoInicioController,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Ano de Início',
                border: OutlineInputBorder(),
                hintText: '2024',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: anoFimController,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.done,
              decoration: const InputDecoration(
                labelText: 'Ano de Fim',
                border: OutlineInputBorder(),
                hintText: '2025',
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
              final anoInicio = int.tryParse(anoInicioController.text);
              final anoFim = int.tryParse(anoFimController.text);

              if (anoInicio == null || anoFim == null) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Por favor, insira anos válidos'),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }

              if (anoFim <= anoInicio) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'O ano de fim deve ser posterior ao ano de início',
                    ),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }

              final anoLetivo = AnoLetivoModel(
                id: 0,
                anoInicio: anoInicio,
                anoFim: anoFim,
                arquivado: false,
              );

              final success = await provider.create(
                anoLetivo,
                createNewYear: isNewYear,
              );

              if (!mounted) return;

              if (success) {
                navigator.pop();
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(
                      isNewYear
                          ? 'Novo ano letivo criado com sucesso. Sistema pronto para novos dados.'
                          : 'Ano letivo adicionado com sucesso',
                    ),
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
            style: ElevatedButton.styleFrom(
              backgroundColor: isNewYear ? Colors.orange : null,
            ),
            child: Text(isNewYear ? 'Criar Novo Ano' : 'Adicionar'),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(AnoLetivoModel anoLetivo) {
    // Prevent editing archived years
    if (anoLetivo.arquivado) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Não é possível editar um ano letivo arquivado. Anos arquivados são apenas para consulta histórica.',
          ),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    final anoInicioController = TextEditingController(
      text: anoLetivo.anoInicio.toString(),
    );
    final anoFimController = TextEditingController(
      text: anoLetivo.anoFim.toString(),
    );

    final provider = context.read<AnoLetivoProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Editar Ano Letivo'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: anoInicioController,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Ano de Início',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: anoFimController,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.done,
              decoration: const InputDecoration(
                labelText: 'Ano de Fim',
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
              final anoInicio = int.tryParse(anoInicioController.text);
              final anoFim = int.tryParse(anoFimController.text);

              if (anoInicio == null || anoFim == null) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Por favor, insira anos válidos'),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }

              if (anoFim <= anoInicio) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'O ano de fim deve ser posterior ao ano de início',
                    ),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }

              final updated = AnoLetivoModel(
                id: anoLetivo.id,
                anoInicio: anoInicio,
                anoFim: anoFim,
                arquivado: anoLetivo.arquivado,
              );

              final success = await provider.update(updated);

              if (!mounted) return;

              if (success) {
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Ano letivo atualizado com sucesso'),
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
            child: const Text('Atualizar'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(AnoLetivoModel anoLetivo) {
    // Prevent deleting archived years
    if (anoLetivo.arquivado) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Não é possível eliminar um ano letivo arquivado. Anos arquivados devem ser preservados para histórico.',
          ),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    final provider = context.read<AnoLetivoProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar Ano Letivo'),
        content: Text(
          'Tem a certeza que deseja eliminar o ano letivo ${anoLetivo.displayName}?\n\n'
          'Nota: Não é possível eliminar anos letivos com dados associados.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              final success = await provider.delete(anoLetivo.id);

              if (!mounted) return;

              if (success) {
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Ano letivo eliminado com sucesso'),
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
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Anos Letivos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<AnoLetivoProvider>().loadAll();
              context.read<AnoLetivoProvider>().loadCurrent();
            },
          ),
        ],
      ),
      drawer: const AppNavigationDrawer(currentRoute: 'anos_letivos'),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'newYear',
            onPressed: () => _showCreateDialog(isNewYear: true),
            backgroundColor: Colors.orange,
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Novo Ano'),
          ),
          const SizedBox(height: 8),
          FloatingActionButton(
            heroTag: 'addYear',
            onPressed: () => _showCreateDialog(isNewYear: false),
            child: const Icon(Icons.add),
          ),
        ],
      ),
      body: Consumer<AnoLetivoProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.items.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.calendar_today, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Nenhum ano letivo encontrado',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Crie um novo ano letivo para começar',
                    style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              if (provider.currentYear != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.green[50],
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Ano Letivo Atual',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.green,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            provider.currentYear!.displayName,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: ListView.builder(
                  itemCount: provider.items.length,
                  itemBuilder: (context, index) {
                    final item = provider.items[index];
                    final isCurrent = provider.currentYear?.id == item.id;
                    final isArchived = item.arquivado;

                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      elevation: isCurrent ? 4 : 1,
                      color: isCurrent
                          ? Colors.green[50]
                          : isArchived
                          ? Colors.grey[100]
                          : null,
                      child: ListTile(
                        leading: Icon(
                          isCurrent
                              ? Icons.star
                              : isArchived
                              ? Icons.archive
                              : Icons.calendar_today,
                          color: isCurrent
                              ? Colors.green
                              : isArchived
                              ? Colors.grey
                              : null,
                        ),
                        title: Row(
                          children: [
                            Text(
                              item.displayName,
                              style: TextStyle(
                                fontWeight: isCurrent
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                color: isArchived ? Colors.grey[700] : null,
                              ),
                            ),
                            if (isArchived) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.grey[300],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Arquivado',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.black54,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        subtitle: Text(
                          isCurrent
                              ? 'Ano Atual'
                              : isArchived
                              ? 'Ano Histórico (Bloqueado)'
                              : 'Ano Histórico',
                          style: TextStyle(
                            color: isCurrent
                                ? Colors.green
                                : isArchived
                                ? Colors.grey
                                : Colors.grey,
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(
                                Icons.edit,
                                color: isArchived ? Colors.grey[400] : null,
                              ),
                              onPressed: isArchived
                                  ? null
                                  : () => _showEditDialog(item),
                              tooltip: isArchived
                                  ? 'Anos arquivados não podem ser editados'
                                  : 'Editar',
                            ),
                            IconButton(
                              icon: Icon(
                                Icons.delete,
                                color: isArchived ? Colors.grey[400] : null,
                              ),
                              onPressed: isArchived
                                  ? null
                                  : () => _showDeleteDialog(item),
                              tooltip: isArchived
                                  ? 'Anos arquivados não podem ser eliminados'
                                  : 'Eliminar',
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
