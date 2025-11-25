import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/docente_model.dart';
import '../providers/docente_provider.dart';

class DocentesScreen extends StatefulWidget {
  const DocentesScreen({super.key});

  @override
  State<DocentesScreen> createState() => _DocentesScreenState();
}

class _DocentesScreenState extends State<DocentesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DocenteProvider>().loadAll();
    });
  }

  void _showCreateDialog() {
    final nomeController = TextEditingController();
    final emailController = TextEditingController();
    final idAreaController = TextEditingController();
    bool convidado = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Novo Docente'),
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
                controller: emailController,
                textInputAction: TextInputAction.next,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: idAreaController,
                textInputAction: TextInputAction.done,
                keyboardType: TextInputType.number,
                onSubmitted: (_) async {
                  final provider = context.read<DocenteProvider>();
                  final navigator = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);

                  final docente = DocenteModel(
                    id: 0,
                    nome: nomeController.text,
                    email: emailController.text,
                    idArea: int.tryParse(idAreaController.text) ?? 0,
                    ativo: true,
                    convidado: convidado,
                  );

                  final success = await provider.create(docente);

                  if (success) {
                    navigator.pop();
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('Docente criado com sucesso'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } else if (provider.error != null) {
                    messenger.showSnackBar(
                      SnackBar(
                        content: Text(provider.error!),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                },
                decoration: const InputDecoration(
                  labelText: 'ID Área Científica',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Convidado'),
                value: convidado,
                onChanged: (value) {
                  setState(() {
                    convidado = value ?? false;
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
                final docente = DocenteModel(
                  id: 0,
                  nome: nomeController.text,
                  email: emailController.text,
                  idArea: int.tryParse(idAreaController.text) ?? 0,
                  ativo: true,
                  convidado: convidado,
                );

                final success = await context.read<DocenteProvider>().create(
                      docente,
                    );

                if (success && mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Docente criado com sucesso'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else if (mounted && context.read<DocenteProvider>().error != null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(context.read<DocenteProvider>().error!),
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
        title: const Text('Docentes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<DocenteProvider>().loadAll();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
      ),
      body: Consumer<DocenteProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    'Erro: ${provider.error}',
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

          if (provider.docentes.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.person_outlined,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Nenhum docente encontrado',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Clique no botão + para adicionar',
                    style: TextStyle(
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.docentes.length,
            itemBuilder: (context, index) {
              final docente = provider.docentes[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: docente.ativo
                        ? Theme.of(context).primaryColor
                        : Colors.grey,
                    child: Text(
                      docente.nome.substring(0, 1).toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    docente.nome,
                    style: TextStyle(
                      decoration: docente.ativo
                          ? null
                          : TextDecoration.lineThrough,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(docente.email),
                      Text(
                        '${docente.ativo ? 'Ativo' : 'Inativo'}${docente.convidado ? ' • Convidado' : ''}',
                        style: TextStyle(
                          fontSize: 12,
                          color: docente.ativo ? Colors.green : Colors.red,
                        ),
                      ),
                    ],
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
                    if (docente.ativo)
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
                      final nomeController =
                          TextEditingController(text: docente.nome);
                      final emailController =
                          TextEditingController(text: docente.email);
                      final idAreaController = TextEditingController(
                          text: docente.idArea.toString());
                      bool convidado = docente.convidado;

                      final result = await showDialog<bool>(
                        context: context,
                        builder: (context) => StatefulBuilder(
                          builder: (context, setState) => AlertDialog(
                            title: const Text('Editar Docente'),
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
                                  controller: emailController,
                                  textInputAction: TextInputAction.next,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: const InputDecoration(
                                    labelText: 'Email',
                                    border: OutlineInputBorder(),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                TextField(
                                  controller: idAreaController,
                                  textInputAction: TextInputAction.done,
                                  keyboardType: TextInputType.number,
                                  onSubmitted: (_) =>
                                      Navigator.pop(context, true),
                                  decoration: const InputDecoration(
                                    labelText: 'ID Área Científica',
                                    border: OutlineInputBorder(),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                CheckboxListTile(
                                  title: const Text('Convidado'),
                                  value: convidado,
                                  onChanged: (value) {
                                    setState(() {
                                      convidado = value ?? false;
                                    });
                                  },
                                ),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancelar'),
                              ),
                              ElevatedButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text('Salvar'),
                              ),
                            ],
                          ),
                        ),
                      );

                      if (result == true && mounted) {
                        final updatedDocente = DocenteModel(
                          id: docente.id,
                          nome: nomeController.text,
                          email: emailController.text,
                          idArea: int.tryParse(idAreaController.text) ?? 0,
                          ativo: docente.ativo,
                          convidado: convidado,
                        );

                        final success = await provider.update(
                            docente.id, updatedDocente);
                        if (success && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Docente atualizado'),
                              backgroundColor: Colors.green,
                            ),
                          );
                        } else if (mounted && provider.error != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(provider.error!),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      }
                    } else if (value == 'deactivate') {
                      final success = await provider.deactivate(docente.id);
                      if (success && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Docente inativado'),
                          ),
                        );
                      } else if (mounted && provider.error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(provider.error!),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    } else if (value == 'reactivate') {
                      final updatedDocente = DocenteModel(
                        id: docente.id,
                        nome: docente.nome,
                        email: docente.email,
                        idArea: docente.idArea,
                        ativo: true,
                        convidado: docente.convidado,
                      );
                      final success =
                          await provider.update(docente.id, updatedDocente);
                      if (success && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Docente reativado'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      } else if (mounted && provider.error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(provider.error!),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    } else if (value == 'delete') {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Confirmar exclusão'),
                          content: Text(
                            'Deseja realmente excluir o docente "${docente.nome}"?',
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
                        final success = await provider.delete(docente.id);
                        if (success && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Docente excluído'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        } else if (mounted && provider.error != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(provider.error!),
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
