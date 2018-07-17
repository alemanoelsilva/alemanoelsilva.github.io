---
layout: post
title: Iniciando o Projeto
categories: [mochilaRouter]
tags: [node, express, sequelize, postgres]
description: Agora que você já sabe o que é o mochilaRouter, vamos iniciar o projeto e suas configurações.
---

## O que é preciso

Para conseguirmos executar o projeto localmente, vamos precisar instalar algumas ferramentas. 

- [Node](https://nodejs.org/en/) v9.5
- [Docker](https://docs.docker.com/install/)
- [Editor](https://code.visualstudio.com/Docs/setup/setup-overview) (utilizo e recomendo o VSCode)

Após instalar essas ferramentas, vamos iniciar o projeto: 

No terminal, crie a pasta **mochila-router-api** (ou outro nome de sua preferência) e dentro dela execute o comando `npm init`. Configure os valores ou apenas tecle <ENTER> para prosseguir e finalizar. 

Aqui, nós já temos a nossa pasta de trabalho com o arquivo `package.json` criado. Esse arquivo é responsável por armazenar as dependências, informações e scripts do projeto. 

Pelo terminal, dentro da pasta de trabalho, vamos executar a instalação de pacotes que vamos precisar. Digite o camando abaixo e tecle ENTER.

```bash
npm install --save express nodemon sequelize dotenv pg pg-hstore
```

Após a instalação, esses pacotes estarão listados no seu arquivo `package.json`.

Os pacotes *sequelize*, *pg*, *pg-hstore* são necessários para a API se comunicar com o Postgres. *dotenv* é utilizado parra carregar as variaveis de ambiente da aplicação, o *nodemon* é um watcher para verificar alterações no código para o servidor ser carregado automaticamente. Já o *express* é o nosso framework para criar abstrações de rotas, middlewares e outras funções que facilitam a criação de serviços.

## Estrutura do projeto

Como vimos no post anterior, precisamos criar uma estrutura igual a essa;

```
  api
  |- helpers
      |- handler-error.js
      |- handler-success.js
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

### Criando o ramo config

Na pasta *config*, vamos criar dois arquivos, _sequelize.js_ e _environment.js_.

  + O conteúdo de _sequelize.js_ será o seguinte:   

  ```js
    'use strict';

    const Sequelize = require('sequelize');
    const { db: { database, user, pass } } = require('./environment');

    let connection = null;

    const connectDB = () => {
      if (connection) return connection;

      connection = new Sequelize(database, user, pass, {
        host: 'localhost',
        dialect: 'postgres',
        operatorsAliases: false
      });

      connection.sync({ force: true })
        .then(() => console.log('Postgres connected'))
        .catch(error => console.log(`Error in the connection Postgres ${error}`))
    };

    module.exports = connectDB;
  ```

  Aqui temos os nossos imports _Sequelize_ do pacote sequelize que instalamos no passo anterior. Ele nos permite criar a conexão com o nosso banco de dados. Ao utilizar `new Sequelize(...)` nós passamos como parâmetro o *database*, *user* e *pass* que obtemos do nosso outro arquivo _environment.js_, além do objeto com o host e dialect.

  Atribuimos a conexão na variável `connection` e executamos o comando `sync` para efetuar a conexão com o banco de dados. Esse comando retorna uma Promise que ao ser resolvida, exibe no terminal a mensagem *Postgres connected*, caso haja algum tipo de erro nesse processo, é exibida a mensagem *Error in the connection Postgres ${error}*.

  > **Obs**: Um erro que obtive nesse processo foi a não criação do database *mochilaRouter* na conexão da aplicação com o Postgres. Ao subir a imagem do Docker é preciso informar o usuário, senha e database. Quando chegarmos nesse ponto explicarei melhor.

  Encapsulamos todo esse processo na função `connectDB`, que ao ser executada valida a conexão antes de criar uma nova, e no final do arquivo a exportamos. 
  
  + O conteúdo de _environment.js_ será o seguinte: 

  ```js
    'use strict';

    const dotenv = require('dotenv');

    dotenv.load();

    module.exports = {
      env: process.env.NODE_ENV,
      app: {
        port: process.env.PORT
      },
      db: {
        database: process.env.POSTGRES_DATABASE,
        user: process.env.POSTGRES_USER,
        pass: process.env.POSTGRES_PASS
      }
    };
  ```

  Esse arquivo é bem menor, o que fazemos é usar o `dotenv` do pacote que instalamos para carregar as variáveis do arquivo `.env` e valorizar o objeto que exportamos. Esse objeto é importado no _sequelize.js_.

### Criando o ramo api

Dentro da pasta *api*, vamos criar mais duas pastas, *helpers* e *itinerary*.

#### Criando o ramo itinerary

A princípio, esta será a pasta onde vamos realmente trabalhar. Vamos criar agora 4 arquivos; _model.js_, _repository.js_, _adapter.js_ e _factory.js_. 

  + O conteúdo de _model.js_ será o seguinte: 
  ```js
    'use strict';

    const Sequelize = require('sequelize');
    const connection = require('../../config/sequelize')();

    const Itinerary = connection.define('itinerary', {
      _id: {
        type: Sequelize.UUID,
        field: '_id',
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      user: {
        type: Sequelize.STRING
      },
      places: {
        type: Sequelize.ARRAY(Sequelize.JSON)
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
      {
        tableName: 'itinerary',
        timestamps: false
      });

      module.exports = Itinerary;
  ```

  Esse arquivo gigante é apenas para mapearmos os campos que o nosso modelo de Roteiro terá. Basicamente,  teremos um id, nome, descrição, duração, se é privado, se está ativo, data de criação e alteração e um array de lugares. 

  Utilizando o Sequelize, podemos definir o tipo do campo `type` por exemplo, além de setar valores default `defaultValue` e permitir ou não valor nulo `allowwNull`.

  A partir da conexão que obtemos do nosso arquivo de configuração do Sequelize, podemos utilizar o método `define` para definir um modelo, esse modelo terá os mesmo campos da nossa tabela, ou seja, vamos criar nossas tabelas sem precisar escrever comandos SQL.

  + O conteúdo de _repository.js_ será o seguinte: 
  ```js
    'use strict';

    module.exports = (model) => ({
      create: data => model.create(data),
    });
  ```

  O repository é utilizado para abstrair a manipulação do banco de dados. Caso haja a necessidade de inserir comandos SQL para uma query ou mesmo elaborar uma consulta mais refinada, podemos deixar completamente separada a lógica de acesso ao banco de dados da lógica de negócio da aplicação. Quando chegarmos nesse ponto ficará mais claro.

  + O conteúdo de _adapter.js_ será o seguinte: 
  ```js
    'use strict';

    exports.createItinerary = async ({
      payload,
      repository,
      onSuccess,
      onError,
    }) => {
      try {
        await repository.saveItinerary(payload);

        return onSuccess(201);
      } catch (error) {
        console.log(`There is an error in creation of Itinerary, ${JSON.stringify(error)}`);
        return onError(error);
      }
    };
  ```

  O adapter é onde temos a nossa lógica de negócio. O importante para um adapter é ter os dados (payload), saber como manipular tais dados, como consultar ou persistir essa informação em algum lugar (repository) e saber como retornar em caso de sucesso (onSuccess) ou em caso de erro (onError).
  Além do código ser legível e de rápida leitura, os testes unitários podem ser codificados de forma simples.

  + O conteúdo de _factory.js_ será o seguinte: 
  ```js
    'use strict';

    const adapter = require('./adapter');
    const model = require('./model');
    const repository = require('./repository')(model);

    const onError = require('../helpers/handler-error');
    const onSuccess = require('../helpers/handler-success');

    module.exports = ({
      createItinerary: (request, response) => adapter.createItinerary({
        payload: request.body,
        repository: {
          saveItinerary: repository.create
        },
        onSuccess: onSuccess(response),
        onError: onError(response)
      })
    });
  ```

  O nosso factory é responsável por montar as dependências que o adapter precisa e simplesmente retornar um objeto que será chamado no _routes.js_ (createItinerary).
  Basicamente é importado tudo que o adapter utiliza (repository, model, onError e onSuccess) e construído um objeto (tal objeto é o mesmo que o adapter recebe (payload, repository, onError e onSuccess).

#### Criando o ramo helpers

Em *helpers* vamos criar dois arquivos _handler-error.js_ e _handler-success.js_.

  + O conteúdo de _handler-error.js_ será o seguinte: 
  ```js
    'use strict';

    module.exports = response => (error) =>
      response.status(error.status || 500).json({
        name: error.name || 'IntervalServerError',
        message: error.message || 'internal server error',
        details: error.details || [error],
        status_code: error.status || 500
      });
  ```

  + O conteúdo de _handler-success.js_ será o seguinte: 
  ```js
    'use strict';

    module.exports = response => (statusCode) =>
      response.status(statusCode).json({});
  ```

  Os nossos dois handlers são para retornar erro ou sucesso nas chamadas http. Optei por coloca-los em uma pasta separada para componentizar a aplicação e efetuar testes posteriormente.
  
### Criando nosso server e routes

Agora que temos todo o *core* da nossa aplicação construída, vamos criar os arquivos _app.js_, _server.js_ e _routes.js_.

  + O conteúdo de _app.js_ será o seguinte: 
  ```js
    'use strict';

    const express = require('express');
    const bodyParser = require('body-parser');

    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    require('./routes')(app);

    module.exports = app;
  ```

  O nosso _app.js_ utiliza o framework express para criar a aplicação, efetuar algumas configurações básicas, inicia as rotas e exporta o `app`.

  + O conteúdo de _server.js_ será o seguinte: 
  ```js
    'use strict';

    require('./config/sequelize')();

    const app = require('./app')
    const config = require('./config/environment')

    app.listen(config.app.port, () => {
      console.log(`Application is running on port`, config.app.port)
    });
  ```

  O _server.js_ efetua a conexão com o banco de dados (require('./config/sequelize')()), importa o app e o config e inicia a aplicação ouvindo a porta definida no arquivo `.env`.

  + O conteúdo de _routes.js_ será o seguinte: 
  ```js
    'use strict';

    const { createItinerary } = require('./api/itinerary/factory');

    module.exports = (app) => {
      app.post('/api/itineraries', createItinerary);
    };
  ```

  O _routes.js_ define o nosso endpoint esperando uma chamada http do tipo POST na url `/api/itineraries` para executar a função createItinerary que é importada da nossa factory que então chama a função de mesmo nome do adapter.

### Executando a API

Para executar a aplicação podemos executar o script **dev** que está definido no `package.json`. Baixem o projeto que está no [github](https://github.com/alemanoelsilva/mochila-router-api/tree/ft/createItinerary)
. 

#### Criando container do Postgres

Antes de subir a aplicação, vamos criar o nosso container do Postgres. Com o docker ja instalado é preciso apenas executar o comando: 

  ```bash
  docker run --name some-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=mochilaRouter -d postgres
  ```

Se tudo der certo, será exibido o hash do id do container no terminal.

#### Iniciando a aplicação

Crie o arquivo `.env` com o conteúdo abaixo: 

  ```bash
  NODE_ENV=development

  POSTGRES_DATABASE=mochilaRouter
  POSTGRES_USER=postgres
  POSTGRES_PASS=postgres123

  PORT=4000
  ```

Como podemos ver, temos os dados para conectar no postgres, são exatamento os mesmo valores que passamos no comando para subir o container. Essas variaveis serão carregadas no nosso arquivo _config/environment.js_ e usadas dentro da aplicação.

O script é `"dev": "nodemon server.js"`. Execute: 
  ```bash 
  npm run dev
  ```

Se tudo ocorrer sem problemas, vocé verá a mensagem `Application is running on port 4000` e logs do postgres dropando as tabelas (caso existam) e criando o database e tabelas.

![npm run dev](https://raw.githubusercontent.com/alemanoelsilva/alemanoelsilva.github.io/master/images/npm%20run%20dev.jpeg)

Nesse ponto, utilizando o postman ou o terminal, podemos testar o endpoint que criamos. Pelo terminal, execute o comando:

  ```bash
  curl -X POST  -H "Content-Type: application/json" -d '{ "name": "Teste 2", "isPrivate": true, "description": "Descrição deste roteiro para teste", "duration": 5, "user": "alemanoelsilva@gmail.com", "places": [{ "name": "Place 1", "attraction": "atraçao 1" }] }' http://localhost:4000/api/itineraries 
  ```

Como não definimos uma mensagem de retorno (no arquivo `api/helpers/onSuccess` é devolvido um objeto vazio). No terminal vamos apenas visualizar **{}**

![curl POST itineraries](https://raw.githubusercontent.com/alemanoelsilva/alemanoelsilva.github.io/master/images/curl%20post%20itinerary.jpeg)

Nos logs da API podemos ver que a API realmente executou a query de inserção do roteiro.

![postgres query insert](https://raw.githubusercontent.com/alemanoelsilva/alemanoelsilva.github.io/master/images/api%20create%20itinerary.jpeg)

Enfim, para validar que realmente está tudo ok, podemos acessar o container do Postgres e ver que o registro está lá.

Para entrar no container execute:

```bash
  docker exec -it some-postgres bash

  psql -h localhost -U postgres -W
  # sua senha será solicitada
```  

> **Obs:** *some-postgres* é o nome do container, caso você tenha o criado lembre-se de alterar para o nome correspondente. *-U postgres* é o nome do usuário, caso esteja usando outro usuário para acessar o Postgres, lembre-se de também alteralo.  

E para acessar a tabela _itinerary_, entre no database mochilaRouter com o comando `\c mochilaRouter` e faça a consulta:

```sql
  select * from itinerary;
```

![table itinerary](https://raw.githubusercontent.com/alemanoelsilva/alemanoelsilva.github.io/master/images/table%20itinerary.jpeg)

### Github

Para ficar mais fácil obter todos os arquivos de cada post, vou sempre separa-los por branch [ft/createItinerary](https://github.com/alemanoelsilva/mochila-router-api/tree/ft/createItinerary)

### Próximos passos

No próximo post vamos efetuar testes unitários da API. 

Até a próxima.
