# Gestão Académica

Este projeto é uma aplicação web de gestão académica, desenhada para gerir informações sobre docentes, cursos, unidades
curriculares (UCs) e outras entidades académicas. A arquitetura é baseada em microserviços, com comunicação via GraphQL
e gRPC, e inclui um sistema completo de autenticação JWT.

## Características Principais

- ✅ **API REST completa** com operações CRUD para todas as entidades
- ✅ **Autenticação JWT** com refresh tokens e rotação de tokens
- ✅ **Sistema de roles** (Administrador, Coordenador, Docente, Convidado)
- ✅ **Gestão de sessões** com suporte para múltiplos dispositivos
- ✅ **Sistema de permissões centralizado** com RBAC granular
- ✅ **Gestão de coordenadores** com atribuições a departamentos e cursos
- ✅ **Validação de dados** e tratamento de erros padronizado
- ✅ **Detecção de duplicados** para campos únicos (nome e sigla)
- ✅ **Auditoria de ações** para segurança e rastreabilidade
- ✅ **CORS configurado** para aplicações Flutter Web
- ✅ **GraphQL Gateway** para agregação de dados
- ✅ **Comunicação gRPC** entre microserviços
- ✅ **Suporte para passwords opcionais** com configuração no primeiro login
- ✅ **Criação automática de utilizadores** ao criar docentes no sistema

## 📂 Estrutura do Projeto

### Serviços Backend

- **`pages/api/`**: API REST (Next.js) - Operações CRUD simples via gRPC

    - `auth/`: Autenticação (login, register, logout, refresh)
    - `coordenador-assignments/`: Gestão de atribuições de coordenadores
    - `departamento/`: Gestão de departamentos
    - `area_cientifica/`: Gestão de áreas científicas
    - `curso/`: Gestão de cursos
    - `uc/`: Gestão de unidades curriculares
    - `docente/`: Gestão de docentes
    - `graus/`: Gestão de graus académicos
    - `docente_grau/`: Gestão de graus de docentes
    - `historico_cv_docente/`: Gestão de histórico de CVs
    - `uc_horas_contacto/`: Gestão de horas de contacto
    - `users/`: Gestão de utilizadores

- **`graphql/`**: Serviço GraphQL - Queries complexas e aninhadas

    - `grpc-helper.js`: Cliente gRPC para GraphQL
    - `resolvers/`: Resolvers para queries complexas
    - `types/`: Definições de tipos GraphQL (sem mutations CRUD)

- **`grpc/service-a/`**: Microserviço gRPC - Única fonte de acesso a dados

    - `server.js`: Implementação completa de CRUD + queries complexas
    - `protos/data.proto`: Definições Protocol Buffers

- **`lib/`**: Bibliotecas partilhadas

    - `grpc-client.js`: Cliente gRPC para Next.js
    - `auth.js`: Autenticação e verificação de tokens
    - `permissions.js`: Sistema centralizado de permissões RBAC
    - `authorize.js`: Middleware de autorização
    - `middleware.js`: Middleware de autenticação
    - `cors.js`: Configuração CORS
    - `audit.js`: Sistema de auditoria
    - `db.js`: Pool de conexões PostgreSQL

- **`mobile/`**: Aplicação Flutter Web (cliente)

### Documentação

- **`db/`**: Scripts de base de dados

    - `init.sql`: Schema completo e dados iniciais

- **`certs/`**: Certificados SSL para desenvolvimento local (não incluído no repositório)

## Requisitos

- [Docker](https://www.docker.com/get-started) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)
- [mkcert](https://github.com/FiloSottile/mkcert) (para gerar certificados SSL locais)

## Configuração de Certificados SSL

Este projeto usa HTTPS para desenvolvimento local. Para gerar certificados:

1. **Instalar mkcert via Chocolatey (Windows):**

   ```powershell
   choco install mkcert
   ```

2. **Instalar a Autoridade Certificadora (CA) local:**

   ```bash
   mkcert -install
   ```

3. **Criar pasta certs/ e gerar certificados:**
   ```bash
   mkdir certs
   cd certs
   mkcert localhost 127.0.0.1 ::1
   ```

Isto criará `localhost+1.pem` e `localhost+1-key.pem` na pasta `certs/`.

## Como Executar

### Pré-requisitos

- Docker e Docker Compose instalados
- **Certificados SSL** (obrigatório - veja secção acima)

### Passos de Instalação

1. **Clone o repositório:**

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd projetoLDS
   ```

2. **Configure os certificados SSL:**

   Siga as instruções na secção "Configuração de Certificados SSL" acima para gerar os certificados com mkcert.

3. **Gere secrets seguros para autenticação JWT:**

   Execute os seguintes comandos para gerar secrets aleatórios e seguros:

   ```bash
   # Gerar JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # Gerar REFRESH_TOKEN_SECRET (executar novamente para obter um valor diferente)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   **Copie os valores gerados** - vão ser necessários no próximo passo.

4. **Configure as variáveis de ambiente:**

   Crie um ficheiro `.env` na raiz do projeto com as seguintes variáveis:

   ```env
   # JWT Authentication (cole os secrets gerados no passo anterior)
   JWT_SECRET=<cole-o-primeiro-secret-gerado>
   REFRESH_TOKEN_SECRET=<cole-o-segundo-secret-gerado>

   # PostgreSQL
   POSTGRES_USER=<seu-usuario>
   POSTGRES_PASSWORD=<sua-senha-forte>
   POSTGRES_DB=projetoLDS

   # Database URL for services
   DATABASE_URL=postgresql://<seu-usuario>:<sua-senha>@db:5432/projetoLDS

   # gRPC Service Address
   GRPC_SERVICE_ADDRESS=service-a:50051
   ```

   **⚠️ IMPORTANTE**:

    - Os secrets JWT são usados pelo servidor para assinar e verificar tokens de todos os utilizadores
    - Use secrets **diferentes** para desenvolvimento e produção
    - Se alterar estes valores depois, todas as sessões de utilizadores serão invalidadas
    - Nunca commit o ficheiro `.env` no repositório!
    - O ficheiro `.env` já está incluído no `.gitignore`

5. **Construa e inicie todos os serviços:**

   ```bash
   docker-compose up --build -d
   ```

6. **Verifique o estado dos serviços:**

   ```bash
   docker-compose ps
   ```

7. **Aguarde alguns segundos para os serviços iniciarem** e aceda:
    - **REST API**: `https://localhost:3000/api`
    - **GraphQL Playground**: `http://localhost:4000/graphql`

### Comandos Úteis

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f nextjs
docker-compose logs -f graphql
docker-compose logs -f service-a
docker-compose logs -f db

# Parar os serviços
docker-compose down

# Parar e remover volumes (limpeza completa)
docker-compose down --volumes

# Reiniciar um serviço específico
docker-compose restart nextjs

# Reconstruir após mudanças no código
docker-compose up --build -d
```

### Limpeza Completa

Se precisar de limpar completamente e recomeçar:

```bash
# Parar tudo e remover volumes
docker-compose down --volumes

# Remover imagens Docker antigas
docker system prune -a --volumes -f

# Reconstruir e iniciar
docker-compose up --build -d
```

### Portas dos Serviços

| Serviço             | Porta | URL                           |
|---------------------|-------|-------------------------------|
| **Next.js Gateway** | 3000  | https://localhost:3000        |
| **GraphQL**         | 4000  | http://localhost:4000/graphql |
| **gRPC Service**    | 50051 | localhost:50051 (interno)     |
| **PostgreSQL**      | 5432  | localhost:5432                |

## Endpoints da API

Todos os endpoints seguem operações CRUD completas. **Base URL:** `https://localhost:3000/api`

### Autenticação

- `POST /auth/register` - Registar novo utilizador
- `POST /auth/login` - Fazer login
- `POST /auth/logout` - Fazer logout (invalida token atual)
- `POST /auth/logout-all` - Fazer logout de todos os dispositivos
- `POST /auth/refresh` - Renovar access token

### Departamento

- `GET /departamento` - Listar todos
- `POST /departamento` - Criar novo (valida nome e sigla únicos)
- `GET /departamento/[id]` - Obter por ID
- `PUT /departamento/[id]` - Atualizar (valida nome e sigla únicos)
- `DELETE /departamento/[id]` - Remover
- `DELETE /departamento/[id]/inativar` - Marcar como inativo

### Área Científica

- `GET /area_cientifica` - Listar todas
- `POST /area_cientifica` - Criar nova
- `GET /area_cientifica/[id]` - Obter por ID
- `PUT /area_cientifica/[id]` - Atualizar
- `DELETE /area_cientifica/[id]` - Remover
- `POST /area_cientifica/[id]/inativar` - Marcar como inativa

### Curso

- `GET /curso` - Listar todos
- `POST /curso` - Criar novo
- `GET /curso/[id]` - Obter por ID
- `PUT /curso/[id]` - Atualizar
- `DELETE /curso/[id]` - Remover (ou marcar como inativo se tiver UCs)
- `POST /curso/[id]/inativar` - Marcar como inativo

### Unidade Curricular (UC)

- `GET /uc` - Listar todas com total de horas
- `POST /uc` - Criar nova
- `GET /uc/[id]` - Obter por ID com detalhes de horas
- `PUT /uc/[id]` - Atualizar
- `DELETE /uc/[id]` - Remover
- `GET /uc/[id]/horas` - Obter horas de contacto

### Horas de Contacto

- `GET /uc_horas_contacto` - Listar todas
- `POST /uc_horas_contacto` - Criar nova
- `GET /uc_horas_contacto/[id_uc]_[tipo]` - Obter específica
- `PUT /uc_horas_contacto/[id_uc]_[tipo]` - Atualizar
- `DELETE /uc_horas_contacto/[id_uc]_[tipo]` - Remover

### Docente

- `GET /docente` - Listar todos (query param: `incluirInativos=true`)
- `POST /docente` - Criar novo
- `GET /docente/[id]` - Obter por ID
- `PUT /docente/[id]` - Atualizar
- `DELETE /docente/[id]` - Remover
- `POST /docente/[id]/inativar` - Marcar como inativo

### Graus Académicos

- `GET /graus` - Listar todos
- `POST /graus` - Criar novo
- `GET /graus/[id]` - Obter por ID
- `PUT /graus/[id]` - Atualizar
- `DELETE /graus/[id]` - Remover

### Graus de Docente

- `GET /docente_grau` - Listar todos
- `POST /docente_grau` - Criar novo
- `GET /docente_grau/[id]` - Obter por ID
- `PUT /docente_grau/[id]` - Atualizar
- `DELETE /docente_grau/[id]` - Remover

### Histórico CV Docente

- `GET /historico_cv_docente` - Listar todos
- `POST /historico_cv_docente` - Criar novo
- `GET /historico_cv_docente/[id]` - Obter por ID
- `PUT /historico_cv_docente/[id]` - Atualizar
- `DELETE /historico_cv_docente/[id]` - Remover

### Atribuições de Coordenadores

- `GET /coordenador-assignments/[id]` - Obter atribuições de um coordenador (departamentos e cursos)
- `POST /coordenador-assignments/[id]/department` - Atribuir coordenador a um departamento
- `DELETE /coordenador-assignments/[id]/department/[depId]` - Remover atribuição de departamento
- `POST /coordenador-assignments/[id]/course` - Atribuir coordenador a um curso
- `DELETE /coordenador-assignments/[id]/course/[courseId]` - Remover atribuição de curso

### Utilizadores

- `GET /users` - Listar todos os utilizadores
- `POST /users` - Criar novo utilizador
- `GET /users/[id]` - Obter utilizador por ID
- `PUT /users/[id]` - Atualizar utilizador
- `DELETE /users/[id]` - Remover utilizador

## Sistema de Permissões (RBAC)

O sistema implementa controlo de acesso baseado em roles (RBAC) com permissões granulares:

### Roles e Permissões

#### **Administrador**

- **Gestão global do sistema**
- Criar, editar e eliminar: cursos, UCs, docentes, áreas científicas, departamentos e utilizadores
- Acesso total a todas as funcionalidades
- Gerir atribuições de coordenadores

#### **Coordenador**

- **Responsável por um ou mais cursos e/ou departamentos**
- Criar e editar UCs nos cursos atribuídos
- Atribuir docentes às UCs do seu curso
- Gerir áreas científicas nos departamentos atribuídos
- Validar e gerir cargas horárias das UCs
- Consultar planos de estudo e informação académica
- **Não pode**: gerir departamentos, utilizadores ou graus académicos

#### **Docente**

- **Utilizador individual com serviço atribuído**
- Consultar o seu próprio serviço e horas
- Atualizar os seus dados pessoais
- Submeter e atualizar o seu CV
- Consultar informação pública (cursos e UCs)
- **Não pode**: modificar outros docentes ou estruturas académicas

#### **Convidado**

- **Utilizador externo autenticado apenas para leitura**
- Consultar informação pública (cursos e planos de estudo)
- **Não pode**: criar, editar ou eliminar qualquer recurso

### Gestão de Coordenadores

Os coordenadores podem ser atribuídos a:

- **Departamentos**: Gerem áreas científicas do departamento
- **Cursos**: Gerem UCs e atribuições de docentes do curso
- Um coordenador pode ter múltiplas atribuições
- Um departamento/curso pode ter múltiplos coordenadores

### First-Time Password Setup

O sistema suporta criação de utilizadores sem password:

- Utilizadores criados sem password têm `password_hash = NULL`
- No primeiro login, o sistema requer definição de password segura
- Após definir a password, o utilizador pode fazer login normalmente
- Útil para criar docentes como utilizadores ao criar departamentos/cursos

## Códigos de Erro Padronizados

A API segue um padrão consistente para respostas de erro:

| Código  | Mensagem                    | Quando Usar                               |
|---------|-----------------------------|-------------------------------------------|
| **400** | `"Dados mal formatados."`   | Campos obrigatórios em falta ou inválidos |
| **401** | `"Token required"`          | Autenticação necessária                   |
| **403** | `"Forbidden"`               | Permissões insuficientes                  |
| **404** | `"[Entidade] inexistente."` | Recurso não encontrado                    |
| **409** | `"[Campo] duplicado."`      | Violação de constraint única              |
| **412** | _Mensagem personalizada_    | Violação de política de negócio           |
| **422** | _Mensagem personalizada_    | Conflito lógico nos dados                 |
| **500** | `"Internal Server Error"`   | Erro inesperado do servidor               |

### Exemplos de Erros

```json
// 400 - Bad Request
{
  "message": "Dados mal formatados."
}

// 404 - Not Found
{
  "message": "Departamento inexistente."
}

// 409 - Conflict
{
  "message": "Email duplicado."
}
```

## Validações Implementadas

### Campos Únicos com Detecção de Duplicados

- **Email** (docente)
- **Nome** (departamento) - validado na criação e atualização
- **Sigla** (departamento, curso, área científica) - validado na criação e atualização
- **Composite key** (id_uc, tipo) em uc_horas_contacto

### Validação de Chaves Estrangeiras

Todas as referências a outras entidades são validadas:

- Departamento em área científica
- Área científica em docente e UC
- Curso em UC
- Docente em graus e histórico CV
- Grau em docente_grau
- UC em horas de contacto

### Validação de Enums

- **curso_tipo**: `'T'`, `'LIC'`, `'MEST'`, `'DOUT'`
- **tipo_hora**: `'PL'`, `'T'`, `'TP'`, `'OT'`
- **user_role**: `'Administrador'`, `'Coordenador'`, `'Docente'`, `'Convidado'`

## Segurança

### Implementações de Segurança

- ✅ **Passwords hashed** com Argon2
- ✅ **JWT tokens** com expiração (15 min para access, 7 dias para refresh)
- ✅ **Refresh token rotation** - tokens antigos invalidados após uso
- ✅ **Session management** - suporte para múltiplos dispositivos
- ✅ **Token revocation** - logout invalida tokens
- ✅ **CORS configurado** para requests cross-origin
- ✅ **HTTPS** com certificados SSL locais
- ✅ **Audit logging** para ações críticas
- ✅ **Role-based access control (RBAC)** centralizado e granular
- ✅ **Permission checking** baseado em contexto (departamento, curso)
- ✅ **Optional passwords** para utilizadores criados por administradores
- ✅ **First-time login** com setup de password obrigatório

### Boas Práticas

- Access tokens de curta duração (15 minutos)
- Refresh tokens seguros e rotacionados
- Hashing forte com Argon2id
- Validação rigorosa de inputs
- Prepared statements para prevenir SQL injection
- CORS restrito a origens conhecidas
- Permissões verificadas em todos os endpoints sensíveis
- Passwords opcionais (NULL) apenas para novos utilizadores

## Detalhes dos Serviços

| Serviço             | Tecnologia      | Porta | Responsabilidade                            |
|---------------------|-----------------|-------|---------------------------------------------|
| **Next.js Gateway** | Next.js 16      | 3000  | REST API (CRUD) + Proxy GraphQL, via gRPC   |
| **GraphQL Service** | Node.js, Apollo | 4000  | Queries complexas aninhadas, via gRPC       |
| **gRPC Service**    | Node.js, gRPC   | 50051 | Fonte única de dados, todas operações de BD |
| **PostgreSQL**      | PostgreSQL 15   | 5432  | Base de dados relacional                    |

### Fluxo de Comunicação

```
Cliente → Next.js (REST/GraphQL) → gRPC Service → PostgreSQL
```

- **Cliente**: Faz pedidos HTTP/HTTPS
- **Next.js**: Recebe pedidos, valida, comunica via gRPC
- **GraphQL**: Resolve queries complexas, comunica via gRPC
- **gRPC**: Executa operações na base de dados
- **PostgreSQL**: Armazena dados

## Troubleshooting

### Verificar estado dos serviços

```bash
# Com Docker
docker-compose ps

# Verificar logs
docker-compose logs -f service-a  # gRPC
docker-compose logs -f graphql    # GraphQL
docker-compose logs -f nextjs     # Next.js
docker-compose logs -f db         # PostgreSQL
```

### Problemas Comuns

#### 1. gRPC Service não conecta

```bash
# Verificar se o serviço está a correr
nc -zv localhost 50051

# Verificar logs
docker logs service-a
```

#### 2. GraphQL não encontra proto files

- Verificar se `grpc/protos/data.proto` existe
- Verificar path em `graphql/grpc-helper.js`
- Rebuild Docker images: `docker-compose up --build`

#### 3. REST API retorna 500

- Verificar se gRPC service está ativo
- Verificar variável `GRPC_SERVICE_ADDRESS` no `.env`
- Verificar logs: `docker logs nextjs`

#### 4. Base de dados não inicializa

```bash
# Limpar volumes e reconstruir
docker-compose down --volumes
docker-compose up --build -d
```

#### 5. Porta já em uso

```bash
# Verificar processos na porta
netstat -ano | findstr :3000
netstat -ano | findstr :4000
netstat -ano | findstr :50051

# Matar processo (Windows)
taskkill /PID <PID> /F
```

#### 6. Erros de permissão (403 Forbidden)

- Verificar role do utilizador: deve ser Administrador, Coordenador, Docente ou Convidado
- Verificar atribuições de coordenador em `coordenador_departamento` ou `coordenador_curso`
- Para Docentes: verificar se `context.professorId` corresponde ao seu ID
- Consultar logs de auditoria: `SELECT * FROM audit_logs WHERE user_id = X ORDER BY created_at DESC`

#### 7. Utilizador não consegue fazer login (password NULL)

- Utilizador foi criado sem password
- Deve fazer first-time setup de password
- No frontend, redirecionar para formulário de criação de password
- Usar endpoint dedicado para set password (se implementado)

## Tecnologias Utilizadas

### Backend

- **Next.js 16** - Framework React para API REST
- **Node.js** - Runtime JavaScript
- **PostgreSQL 15** - Base de dados relacional
- **Apollo Server** - GraphQL server
- **gRPC** - Comunicação entre microserviços

### Autenticação e Segurança

- **jsonwebtoken** - JWT tokens
- **argon2** - Password hashing
- **crypto** - Geração de UUIDs

### Ferramentas

- **Docker & Docker Compose** - Containerização
- **pg (node-postgres)** - Cliente PostgreSQL

## Testes

### Testar Autenticação com Postman/cURL

**Nota:** Os exemplos abaixo usam credenciais de teste. Substitua pelos seus próprios valores.

**1. Registar um novo utilizador:**

```bash
curl -k -X POST https://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!","role":"Administrador"}'
```

**2. Fazer login:**

```bash
curl -k -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!"}'
```

**3. Usar o token retornado para aceder a endpoints protegidos:**

```bash
curl -k -X GET https://localhost:3000/api/departamento \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**4. Renovar o token:**

```bash
curl -k -X POST https://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

**Nota:** O flag `-k` permite conexões HTTPS sem verificar o certificado (apenas para desenvolvimento).

### Testar Operações CRUD

Exemplo: Criar um departamento:

```bash
curl -k -X POST https://localhost:3000/api/departamento \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Engenharia","sigla":"ENG","ativo":true}'
```

## Acesso à Base de Dados

Para aceder diretamente à base de dados PostgreSQL:

```bash
# Via Docker
docker-compose exec db psql -U admin -d gestao_academica

# Via cliente local (se tiver psql instalado)
psql -h localhost -p 5432 -U admin -d gestao_academica
```

## Estrutura da Base de Dados

A base de dados inclui as seguintes tabelas principais:

### Utilizadores e Autenticação

- **users** - Utilizadores do sistema (com role e password opcional)
- **sessions** - Sessões ativas com family tracking
- **refresh_tokens** - Tokens de refresh com rotação
- **coordenador_departamento** - Atribuições de coordenadores a departamentos
- **coordenador_curso** - Atribuições de coordenadores a cursos

### Estrutura Académica

- **departamento** - Departamentos académicos
- **area_cientifica** - Áreas científicas (pertencentes a departamentos)
- **curso** - Cursos (licenciatura, mestrado, doutoramento)
- **uc** - Unidades curriculares (com horas_por_ects configurável)
- **uc_horas_contacto** - Horas de contacto por tipo (T, TP, PL, OT)
- **uc_turma** - Turmas por UC e ano letivo

### Docentes

- **docente** - Docentes (com estado ativo/inativo)
- **grau** - Graus académicos
- **docente_grau** - Relação entre docentes e graus
- **historico_cv_docente** - Histórico de CVs
- **historico_contrato_docente** - Histórico de contratos

### Sistema

- **ano_letivo** - Anos letivos (com estado arquivado)
- **audit_logs** - Logs de auditoria de ações
- **api_keys** - Chaves de API para integrações

### Características Importantes do Schema

- **Passwords NULL permitidos**: Utilizadores podem ser criados sem password (first-time setup)
- **Archiving de anos letivos**: Anos podem ser arquivados sem serem eliminados
- **Horas por ECTS configuráveis**: Cada UC pode ter valor personalizado (padrão: 28)
- **Coordinator assignments**: Junction tables para atribuições de coordenadores
- **Cascading deletes**: Configurados adequadamente para manter integridade referencial
- **Indexes otimizados**: Para queries frequentes (sessions, coordenadores, etc.)

Veja `db/init.sql` para o schema completo.

## Testar GraphQL

Aceda ao GraphQL Playground em `http://localhost:4000/graphql` e teste queries:

```graphql
# Exemplo: Obter todos os departamentos com estatísticas
query {
    departamentosWithStats {
        id_dep
        nome
        sigla
        num_areas
        num_docentes
        num_cursos
    }
}
```

## Frontend (Flutter Web)

A aplicação inclui um frontend desenvolvido em **Flutter Web** na pasta `mobile/`.

### Desenvolvimento Local

Para desenvolver o frontend localmente:

```bash
cd mobile
flutter pub get
flutter run -d chrome
```

### Build e Deploy para Servidor

O projeto inclui scripts para construir e servir a aplicação Flutter Web via HTTPS:

**1. Build da aplicação:**

```bash
cd mobile

# Windows (PowerShell)
.\build-web.ps1 -ServerIp "your_ip"

# Linux/Mac (Bash)
./build-web.sh your_ip
```

O script de build:

- Compila a aplicação Flutter para web
- Injeta as URLs corretas da API via `--dart-define`
- Gera os ficheiros estáticos em `build/web/`

**2. Servir via HTTPS:**

```bash
# Certifique-se de que os certificados SSL existem em ../certs/
python3 serve_https.py
```

O servidor HTTPS Python:

- Serve os ficheiros de `build/web/` na porta especificada (padrão: 8000)
- Usa os certificados SSL de `../certs/localhost+1.pem`
- Necessário para Service Workers e funcionalidades PWA
- Permite comunicação segura com a API HTTPS

**3. Aceder à aplicação:**

- **Local**: `https://localhost:8000`
- **Servidor**: `https://<server-ip>:8000`

### Configuração de CORS

Para permitir que a aplicação Flutter aceda à API, configure a variável de ambiente no servidor:

```env
# No ficheiro .env do servidor
CORS_ALLOWED_ORIGINS=https://your_ip:8000,https://localhost:8000
```

Após alterar, reinicie o serviço Next.js:

```bash
docker-compose restart nextjs
```

### Funcionalidades da Interface Flutter

A aplicação Flutter Web implementa:

- ✅ **Sistema de Login** com autenticação JWT
- ✅ **Interface responsiva** para gestão académica
- ✅ **RBAC integrado** com controlo de acesso baseado em roles
- ✅ **Gestão de UCs** com filtros avançados (ano, semestre, curso)
- ✅ **Gestão de horas de contacto** com cálculo automático
- ✅ **Gestão de anos letivos** com sistema de arquivo
- ✅ **CRUD completo** para departamentos, cursos, áreas, docentes
- ✅ **Interface adaptativa** mostra/esconde funcionalidades baseado em permissões
- ✅ **Tema claro/escuro** com persistência de preferências

### Filtros de UCs

A interface de UCs implementa filtros inteligentes:

- **Filtro por Ano**: Valores de 1 a 3 (maioria dos cursos tem 3 anos)
- **Filtro por Semestre**: Valores de 1 a 6 (semestre cumulativo)
    - Exemplo: 3º ano, 1º semestre = 5º semestre cumulativo
    - Permite buscar todas as UCs de um ano específico ou de um semestre específico
- **Filtro por Curso**: Dropdown com todos os cursos disponíveis
- Os filtros podem ser combinados ou usados individualmente

### Gestão de Horas

A interface para gerir horas de contacto:

- **Cálculo automático** de horas totais baseado em ECTS
- **Horas por ECTS configuráveis** (padrão: 28)
- **Dialog com largura fixa** para melhor UX
- **Preservação do valor** de horas_por_ects ao editar
- **Validação** de valores mínimos e consistência

## Sobre o Projeto

Este é um **projeto académico** desenvolvido no âmbito da disciplina de Laboratório de Desenvolvimento de Software (
LDS).

### Objetivos do Projeto

- ✅ Implementar arquitetura de microserviços com separação clara de responsabilidades
- ✅ Desenvolver APIs REST (20+ endpoints), GraphQL (8 queries) e gRPC (7+ operações)
- ✅ Implementar sistema de autenticação e autorização robusto com JWT e RBAC granular
- ✅ Aplicar boas práticas de desenvolvimento (clean code, SOLID, DRY)
- ✅ Utilizar containerização com Docker e orquestração com Docker Compose
- ✅ Implementar validações completas e tratamento de erros padronizado
- ✅ Criar fonte única de verdade para dados com gRPC microservice
- ✅ Sistema de permissões centralizado com controlo contextual
- ✅ Interface Flutter Web completa com RBAC integrado

### Tecnologias Exploradas

Este projeto serve como demonstração prática de:

- **Arquitetura de Microserviços** com comunicação gRPC
- **API REST** com Next.js 16 e Node.js (100% via gRPC)
- **GraphQL** com Apollo Server para queries complexas
- **gRPC** como camada de acesso a dados
- **Base de dados relacional** PostgreSQL 15
- **Segurança** com JWT, Argon2 e RBAC centralizado
- **Controlo de Acesso** granular com permissões baseadas em contexto
- **DevOps** com Docker, Docker Compose e multi-stage builds
- **Protocol Buffers** para definições de tipos
- **Frontend moderno** com Flutter Web e gestão de estado
- **Documentação técnica** completa e estruturada

### Arquitetura Final

```
Flutter Web ←→ Next.js Gateway ←→ gRPC Microservice ←→ PostgreSQL
                (REST + GraphQL)      (Permissions)
```

- **Separação de Responsabilidades**: REST para CRUD, GraphQL para queries complexas
- **Fonte Única de Dados**: Todas as operações de BD via gRPC
- **Escalabilidade**: Serviços independentes que podem escalar individualmente
- **Type Safety**: Definições proto garantem consistência entre serviços
- **Security by Design**: Permissões verificadas em todas as camadas

---

**Projeto Académico** | Laboratório de Desenvolvimento de Software  
**Arquitetura:** Microserviços com gRPC, REST e GraphQL  
**Frontend:** Flutter Web com HTTPS e RBAC  
**Última atualização:** 5 de Janeiro de 2026
