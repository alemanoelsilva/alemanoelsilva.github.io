---
layout: post
title: Vamos fazer alguns testes?
categories: [mochilaRouter]
tags: [node, express, sequelize, postgres]
description: Agora que você já sabe o que é o mochilaRouter, vamos iniciar o projeto e suas configurações.
---

## Mas antes...

Para você conseguir escrever os primeiros testes unitários, vamos refatorar alguns pontos da aplicação. 

### Refatorando nossos arquivos de configuração

O primeiro ponto de mudança será o arquivo _sequelize.js_. Vamos incluir um objeto que retorna três funçóes: 
  - Connect: função que recebe três parâmetros, _database_, _user_ e _pass_ e efetua a conexão com o Postgres.
  - Disconnect: função para fechar a conexão com o Postgres.
  - getConnection: função para retornar a instância de uma conexão.

A função _connect_ agora não realiza mais o sincronismo com o banco de dados (`connection.sync(...)`), agora essa responsabilidade será de cada modelo. 

O arquivo _sequelize.js_ ficou da seguinte forme: 

```js
  'use strict';

  const Sequelize = require('sequelize');

  let connection = null;

  const sequelizeDB = ({
    connect: async ({ database, user, pass }) => {
      if (connection) return connection;

      try {
        connection = new Sequelize(database, user, pass, {
          host: 'localhost',
          dialect: 'postgres',
          operatorsAliases: false
        });

        console.log(`Database connected ${database}`);

        return connection;
      } catch (error) {
        console.log(`There is an error in the connection Postgres ${error}`);
        return null;
      }
    },

    disconnect: () => {
      connection.close();
    },

    getConnection: () => connection

  });

  module.exports = sequelizeDB;
```

Ainda na pasta _config_, temos o arquivo de variaveis de ambiente _environment.js_. A mudança significativa aqui é a atribuição do valor na variavel database, passamos a validar se a aplicação está sendo executada em ambiente de teste, o arquivo ficou da seguinte forma:

```js
  'use strict';

  require('dotenv').load();

  const ENVIRONMENT = {
    TEST: 'test',
    DEV: 'development',
    PROD: 'production'
  };

  const env = process.env.NODE_ENV || ENVIRONMENT.DEV;

  const vars = {
    env,
    app: {
      port: process.env.PORT
    },
    db: {
      database: env === ENVIRONMENT.TEST ? process.env.POSTGRES_DATABASE_TEST : process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      pass: process.env.POSTGRES_PASS
    }
  };

  module.exports = vars;
```

Como podemos ver, se o ambiente (NODE_ENV) for de teste, atribuímos a database o valor de POSTGRES_DATABASE_TEST, caso contrário, o valor de database será POSTGRES_DATABASE. 

Vamos partir para os arquivos _server.js_ e _app.js_. 

O nosso _app.js_ mudou pouca coisa, apenas encapsulamos nossa configuração numa função e a exportamos. 

```js
  'use strict';

  module.exports = () => {
    const express = require('express');
    const path = require('path');
    const bodyParser = require('body-parser');

    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'public')));

    require('./routes')(app);

    return app;
  };
```

Porque fizemos isso? 
No arquivo _server.js_, precisamos estabelecer primeiro a conexão com o banco de dados Postgres e depois iniciar o servidor. Isso é necessário porque o nome modelo passa a utilizar a função `getConnection` para então criar os modelos da aplicação. 

O arquivo ficou assim: 

```js
  'use strict';

  const { connect } = require('./config/sequelize');

  const app = require('./app');
  const { app: { port }, db: { database, user, pass } } = require('./config/environment');

  const init = async () => {
    const response = await connect({ database, user, pass });

    if (!response) return null;

    app().listen(port, () => {
      console.log(`Application is running on port ${port}`);
    })
  };

  init();
```

Importamos a função `connect` do nosso arquivo de configuração do Sequelize e efetuamos a conexão passando o database, usuário e senha. Após a conexão ser efetuar com sucesso (o `response` é valorizado) iniciamos nosso servidor executando a função `app()` que retorna o app construído no arquivo _app.js_.

### Refatorando nosso modelo

Agora falta apenas refatorar o código no nosso modelo que está na pasta api. No nosso modelo, vamos importar a função `getConnection` do arquivo de configuração do Sequelize para definirmos o modelo. Assim que o modelo estiver pronto, vamos fazer o sincronismo no banco de dados utilizando a função `sync(...)`.

O arquivo _model.js_ ficou assim: 

```js
  'use strict';

  const Sequelize = require('sequelize');
  const { getConnection } = require('../../config/sequelize');

  const Itinerary = getConnection().define('itinerary', {
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
  }, {
    tableName: 'itinerary',
    timestamps: false
  });

  Itinerary.sync({ force: false });

  module.exports = Itinerary;
```

O parâmetro `{ force: false }` não força o Postgres a deletar e criar novamente a tabela. 

Feito esse refatoração, vamos enfim para os testes. 

### Efetuando teste unitário

### Instalando e configurando o Jest


### Criando nossos primeiros testes

#### Itinerary Adapter
#### Itinerary Repository
#### Handler Success 
#### Handler Error



### Github

Para ficar mais fácil obter todos os arquivos de cada post, vou sempre separa-los por branch [ft/createItinerary](https://github.com/alemanoelsilva/mochila-router-api/tree/ft/createItinerary)

### Próximos passos

No próximo post vamos efetuar testes unitários e integrados da API. 

Até a próxima.