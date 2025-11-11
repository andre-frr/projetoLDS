# Gestão Académica

Este projeto é uma aplicação web de gestão académica, desenhada para gerir informações sobre docentes, cursos, unidades
curriculares (UCs) e outras entidades académicas. A arquitetura é baseada em microserviços, com comunicação via GraphQL
e gRPC.

## Estrutura do Projeto

O projeto está dividido nos seguintes serviços de backend:

- `pages/`: Um serviço de backend desenvolvido com Next.js que expõe uma API REST.
- `graphql/`: Um serviço de API GraphQL que atua como um gateway, agregando dados de outros serviços e expondo-os a um
  único endpoint.
- `grpc/`: Contém serviços gRPC para comunicação interna de alta performance entre os microserviços.
    - `service-a/`: Um exemplo de um serviço gRPC.
    - `service-b/`: Um cliente que consome o `service-a`.
- `db/`: Contém o script de inicialização (`init.sql`) para a base de dados PostgreSQL, definindo o esquema e inserindo
  dados iniciais.
- `docker-compose.yml`: O ficheiro de orquestração que define e interliga todos os serviços, permitindo que sejam
  executados em conjunto com um único comando.

O frontend para esta aplicação será desenvolvido separadamente utilizando o Flutter Framework.

## Pré-requisitos

Para executar este projeto, necessita de ter o seguinte software instalado:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Como Executar

1. **Clone o repositório para a sua máquina local:**
   ```sh
   git clone <URL_DO_REPOSITORIO>
   cd <NOME_DA_PASTA>
   ```

2. **Construa e inicie os contentores Docker:**
   Execute o seguinte comando na raiz do projeto. O `--build` garante que as imagens são construídas de acordo com as
   versões mais recentes dos Dockerfiles.
   ```sh
   docker-compose up --build
   ```

3. **Aceda aos Serviços:**
   Após os contentores estarem a funcionar, os serviços estarão disponíveis nos seguintes endereços:

    - **API REST (Next.js)**: [https://localhost:3000/api](https://localhost:3000/api)
    - **GraphQL Playground**: [http://localhost:4000/graphql](http://localhost:4000/graphql)

## Detalhes dos Serviços

| Serviço             | Tecnologia      | Porta Exposta | Descrição                                                              |
| ------------------- | --------------- | ------------- | ---------------------------------------------------------------------- |
| **API REST**        | Next.js         | `3000`        | Expõe endpoints REST para as operações da aplicação.                   |
| **API GraphQL**     | Node.js, Apollo | `4000`        | Gateway que agrega e expõe os dados dos microserviços.                 |
| **gRPC Service A**  | Node.js, gRPC   | `50051`       | Serviço interno para operações específicas.                            |
| **Base de Dados**   | PostgreSQL      | `5432`        | Armazena todos os dados relacionais da aplicação.                      |

Para parar todos os serviços, pressione `Ctrl + C` no terminal onde o `docker-compose` está a ser executado, e depois
execute `docker-compose down` para remover os contentores.

