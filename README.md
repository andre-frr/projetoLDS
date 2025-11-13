# Gestão Académica

Este projeto é uma aplicação web de gestão académica, desenhada para gerir informações sobre docentes, cursos, unidades
curriculares (UCs) e outras entidades académicas. A arquitetura é baseada em microserviços, com comunicação via GraphQL
e gRPC, e inclui um sistema completo de autenticação JWT.

## Características Principais

- ✅ **API REST completa** com operações CRUD para todas as entidades
- ✅ **Autenticação JWT** com refresh tokens e rotação de tokens
- ✅ **Sistema de roles** (Administrador, Coordenador, Docente, Convidado)
- ✅ **Gestão de sessões** com suporte para múltiplos dispositivos
- ✅ **Validação de dados** e tratamento de erros padronizado
- ✅ **Detecção de duplicados** para campos únicos
- ✅ **Auditoria de ações** para segurança e rastreabilidade
- ✅ **GraphQL Gateway** para agregação de dados
- ✅ **Comunicação gRPC** entre microserviços

## Estrutura do Projeto

O projeto está dividido nos seguintes serviços de backend:

- **`pages/`**: Serviço backend Next.js que expõe a API REST principal
  - `api/auth/`: Endpoints de autenticação (login, register, logout, refresh)
  - `api/departamento/`: Gestão de departamentos
  - `api/area_cientifica/`: Gestão de áreas científicas
  - `api/curso/`: Gestão de cursos
  - `api/uc/`: Gestão de unidades curriculares
  - `api/docente/`: Gestão de docentes
  - `api/graus/`: Gestão de graus académicos
  - `api/docente_grau/`: Gestão de graus de docentes
  - `api/historico_cv_docente/`: Gestão de histórico de CVs
  - `api/uc_horas_contacto/`: Gestão de horas de contacto

- **`lib/`**: Biblioteca partilhada com utilitários
  - `auth.js`: Funções de autenticação e verificação de tokens
  - `db.js`: Configuração da pool de conexões PostgreSQL
  - `middleware.js`: Middleware de autenticação e autorização
  - `cors.js`: Configuração CORS
  - `audit.js`: Sistema de auditoria

- **`graphql/`**: Serviço GraphQL que atua como gateway
  - `schema.js`: Definição do schema GraphQL
  - `resolvers.js`: Resolvers principais
  - `types/`: Definições de tipos GraphQL
  - `resolvers/`: Resolvers específicos por entidade

- **`grpc/`**: Serviços gRPC para comunicação interna
  - `service-a/`: Serviço gRPC de exemplo
  - `service-b/`: Cliente gRPC de exemplo
  - `protos/`: Definições Protocol Buffers

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

1. **Clone o repositório para a sua máquina local:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd projetoLDS
   ```

2. **Configure os certificados SSL** (veja secção acima)

3. **Configure as variáveis de ambiente (opcional):**
   
   Crie um ficheiro `.env` na raiz do projeto:
   ```env
   JWT_SECRET=your-secret-key
   REFRESH_TOKEN_SECRET=your-refresh-secret-key
   DATABASE_URL=postgresql://user:password@postgres:5432/gestao_academica
   ```

4. **Construa e inicie os contentores Docker:**
   ```bash
   docker compose up --build -d
   ```

5. **Para uma limpeza completa antes de iniciar:**
   ```bash
   docker compose down --volumes && docker system prune -a --volumes
   docker compose up --build -d
   ```

6. **Aceda à API em:** `https://localhost:3000`

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
- `POST /departamento` - Criar novo
- `GET /departamento/[id]` - Obter por ID
- `PUT /departamento/[id]` - Atualizar
- `DELETE /departamento/[id]` - Remover

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

## Códigos de Erro Padronizados

A API segue um padrão consistente para respostas de erro:

| Código | Mensagem                      | Quando Usar                              |
|--------|-------------------------------|------------------------------------------|
| **400** | `"Dados mal formatados."`    | Campos obrigatórios em falta ou inválidos |
| **401** | `"Token required"`           | Autenticação necessária                  |
| **403** | `"Forbidden"`                | Permissões insuficientes                 |
| **404** | `"[Entidade] inexistente."` | Recurso não encontrado                   |
| **409** | `"[Campo] duplicado."`       | Violação de constraint única             |
| **412** | *Mensagem personalizada*     | Violação de política de negócio          |
| **422** | *Mensagem personalizada*     | Conflito lógico nos dados                |
| **500** | `"Internal Server Error"`    | Erro inesperado do servidor              |

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
- **Sigla** (departamento, curso, área científica)
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
- ✅ **Role-based access control** (RBAC)

### Boas Práticas

- Access tokens de curta duração (15 minutos)
- Refresh tokens seguros e rotacionados
- Hashing forte com Argon2id
- Validação rigorosa de inputs
- Prepared statements para prevenir SQL injection
- CORS restrito a origens conhecidas

## Detalhes dos Serviços

| Serviço            | Tecnologia          | Porta | Descrição                                              |
|--------------------|---------------------|-------|--------------------------------------------------------|
| **API REST**       | Next.js 16          | 3000  | API REST principal com JWT auth                        |
| **API GraphQL**    | Node.js, Apollo     | 4000  | Gateway que agrega dados dos microserviços             |
| **gRPC Service A** | Node.js, gRPC       | 50051 | Serviço interno para operações específicas             |
| **Base de Dados**  | PostgreSQL 15       | 5432  | Armazena todos os dados relacionais da aplicação       |

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

## Comandos Úteis

```bash
# Iniciar todos os serviços em background
docker compose up --build -d

# Parar e limpar completamente (volumes + imagens)
docker compose down --volumes && docker system prune -a --volumes

# Ver logs do serviço Next.js
docker compose logs -f nextjs

# Ver logs de todos os serviços
docker compose logs -f

# Reiniciar um serviço específico
docker compose restart nextjs

# Parar todos os serviços (manter volumes)
docker compose down

# Executar comando na base de dados
docker compose exec postgres psql -U user -d gestao_academica

# Ver status dos contentores
docker compose ps
```

## Troubleshooting

### Problema: Porta já em uso
```bash
# Verificar processos usando a porta 3000
netstat -ano | findstr :3000

# Parar o processo ou alterar a porta no docker-compose.yml
```

### Problema: Erro de conexão à base de dados
```bash
# Verificar se o PostgreSQL está a correr
docker compose ps

# Ver logs do PostgreSQL
docker compose logs postgres

# Reiniciar o serviço
docker compose restart postgres
```

### Problema: Certificados SSL
Os certificados em `certs/` são para desenvolvimento local. Para produção, use certificados válidos.

## Estrutura da Base de Dados

A base de dados inclui as seguintes tabelas principais:

- **users** - Utilizadores do sistema
- **sessions** - Sessões ativas
- **refresh_tokens** - Tokens de refresh
- **departamento** - Departamentos académicos
- **area_cientifica** - Áreas científicas
- **curso** - Cursos
- **uc** - Unidades curriculares
- **uc_horas_contacto** - Horas de contacto por UC
- **docente** - Docentes
- **grau** - Graus académicos
- **docente_grau** - Relação docente-grau
- **historico_cv_docente** - Histórico de CVs de docentes

Veja `db/init.sql` para o schema completo.

## Frontend

O frontend para esta aplicação será desenvolvido separadamente utilizando o **Flutter Framework**.

## Sobre o Projeto

Este é um **projeto académico** desenvolvido no âmbito da disciplina de Laboratório de Desenvolvimento de Software (LDS).

### Objetivos do Projeto

- Implementar uma arquitetura de microserviços completa
- Desenvolver APIs REST, GraphQL e gRPC
- Implementar sistema de autenticação e autorização robusto
- Aplicar boas práticas de desenvolvimento de software
- Utilizar containerização com Docker
- Implementar validações e tratamento de erros padronizado

### Tecnologias Exploradas

Este projeto serve como demonstração prática de:
- **Backend moderno** com Next.js 16 e Node.js
- **Bases de dados relacionais** com PostgreSQL
- **Segurança** com JWT, Argon2 e RBAC
- **Microserviços** com comunicação GraphQL e gRPC
- **DevOps** com Docker e Docker Compose
- **Documentação** técnica completa

---

**Projeto Académico** | Laboratório de Desenvolvimento de Software  
**Última atualização:** 13 de Novembro de 2025

