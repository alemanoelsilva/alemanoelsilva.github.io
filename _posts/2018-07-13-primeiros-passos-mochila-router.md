---
layout: post
title: Primeiros Passos
categories: [mochilaRouter]
tags: [node, express, sequelize, postgres]
description: Esse é o primeiro post de uma série onde pretendo construir uma aplicação backend utilizando o padrão REST, arquitetura hexagonal, separação de componentes e testes unitários e integrados.
---

## Introdução

A ideia desta série de artigos é compartilhar os meus estudos e sempre escrever artigos para me forçar a continuar estudando. 

Eu particularmente não gosto de estudar fazendos exemplos de tutoriais, prefiro estudar (livros, videos) sobre o assunto em queståo e sempre tentar criar algo para realmente colocar a mão na massa. 

Bom, o que quero construir aqui é uma aplicação backend (API) que receberá request e responderá `json's` para o cliente (web e mobile). Não sou criativos para dar nomes, então resolvi chamar essa API de mochilaRouter. 

O que é o projeto **mochilaRouter**? 

Tenho várias ideias e features para implementar, mas vamos começar pelo básico. Criar roteiros de viagem. 

Nesse inicio, vamos criar cinco endpoints para manipulação das informações de um roteiro de viagem. 

Vamos utilizar as seguintes tecnologias: 

- Node
  - Express
  - Sequelize
  - Dotenv
- Postgres
- Docker

### Organização de pastas que vamos adotar
  

```
  api
  |- helpers
      |- handler-error.js
      |- handler-sucess.js
  |- itinerary
      |- adapter.js
      |- factory.js
      |- model.js
      |- repository.js
  |- config
      |- environmente.js
      |- sequelize.js
  app.js
  routes.js
  server.js
  .env
  Readme.md
```

A pasta *api* conterá todos os arquivos necessários para a execução da aplicação. 

Dentro de *api* temos: 
1. **helpers**: funções auxiliares, poderiamos chamar de _utils_ ou _commons_.
2. **config**: configurações em geral. 
3. **itinerary**: essta pasta conterá o nosso modelo de Roteiro, repository que abstrai a manipulação do banco de dados, adapter que implementa a lógica do endpoint e o factory para construir o objeto a ser injetado na rota.

Já os outros arquivos, _server.js_ e _app.js_ contém as configurações da aplicação e o arquivo _routes.js_ contém as rotas.

O arquivo _.env_ nos utilizamos para mapear as variaveis de ambiente e **não comitamos no repositório**.

Geralmente no _Readme.md_ tem um bloco com a configuração necessária para a criação do arquivo _.env_. 

Por exemplo: 

![readme with configuration of .env file](https://raw.githubusercontent.com/alemanoelsilva/alemanoelsilva.github.io/master/images/to%20iniatialize%20the%20application.jpeg)

O próximo post vamos colocar a mão na massa e iniciar o projeto.
