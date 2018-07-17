---
layout: post
title: Vamos fazer alguns testes?
categories: [mochilaRouter]
tags: [node, express, sequelize, postgres]
description: Criado nosso primeiro endpoint, vamos configurar e executar alguns testes untiários.
---

## Mas antes...

Para você conseguir escrever os primeiros testes unitários, vamos refatorar alguns pontos da aplicação. 

### Refatorando nossos arquivos de configuração

O primeiro ponto de mudança será o arquivo _sequelize.js_. Vamos incluir um objeto que retorna três funções: 
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
No arquivo _server.js_, precisamos estabelecer primeiro a conexão com o banco de dados Postgres e depois iniciar o servidor. Isso é necessário porque o nosso modelo passou a utilizar a função `getConnection` para obter a conexão do banco de dados. 

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

Feito essa refatoração, vamos enfim para os testes. 

### Instalando e configurando o Jest

Precisamos instalar 2 pacotes para rodar os testes unitários, no terminal, execute o comando abaixo: 

```bash
  npm install --save-dev jest jest-plugin-context
```

Além disso, precisamos criar um arquivo de _setup_ e incluir algumas configurações do jest no `package.json`.

Vamos incluir o objeto do jest no `package.json` com as seguintes configurações: 

  - verbose: Indica a forma como os testes são impressos no terminal.
  - setupTestFrameworkScriptFile: Essa propriedade mapeia o caminho do arquivo de _setup.js_.
  - collectCoverageFrom: Mapeia os diretórios que serão analisados para a cobertura de teste.
  - coverageReporters: Formato de reporte dos testes.
  - coverageThreshold: Estabelece a taxa de cobertura mínima dos nossos testes.
  - setupFiles: Recebe um array com configurações opcionais. 

O objeto do jest fica da seguinte forma: 

```json
  {
    "jest": {
      "verbose": true,
      "setupTestFrameworkScriptFile": "./test/setup.js",
      "collectCoverageFrom": [
        "api/**/*.js",
        "!**/node_modules/**",
        "!**/config/**"
      ],
      "coverageReporters": [
        "text",
        "text-summary",
        "html"
      ],
      "coverageThreshold": {
        "global": {
          "branches": 80,
          "functions": 80,
          "lines": 80,
          "statements": 80
        }
      },
      "setupFiles": [
        "jest-plugin-context/setup"
      ]
    }
  }
```

Além do objeto do jest, vamos incluir o script para executar os testes unitários a partir do comando `npm run test:unit`. 

```json
  { "test:unit": "NODE_ENV=test jest --coverage --runInBand --forceExit ./test/unit/*.spec.js" }
```

Agora vamos criar nosso arquivo de _setup.js_. Na raiz do projeto crie uma pasta chamada _test_, dentro dela crie o arquivo _setup.js_. O seu conteúdo será o seguinte: 

```js
  'use strict';

  const { connect } = require('../config/sequelize');
  const { db: { database, user, pass } } = require('../config/environment');

  const init = async () => {
    await connect({ database, user, pass });
  };

  init();
```

Esse código importa as variaveis de ambiente e a função `connect` do nosso arquivo de configuração do banco de dados e efetua a conexão com o banco de dados. Esse setup é necessário apenas para os testes integrados.

### Personalizando nosso Postgres

Ao efetuarmos testes na api, o ideal é não utilizarmos o banco de dados da aplicação, por isso, precisamos criar um database especifico para testes, aqui vamos criar um database chamado `mochilarouter_test`. Para isso, vamos criar uma imagem do postgres personalizada. 

Na raiz do projeto, crie um arquivo chamado `Dockerfile` (sem nenhuma extensão). O contéudo dele será bem simples.

```bash
FROM postgres:latest

COPY ./scripts/create_db.sh     /docker-entrypoint-initdb.d/10-create_db.sh
```

Estamos construíndo a imagem a partir da imagem base do postgres:latest e copiando um script para dentro da imagem. 

Na raiz do projeto, crie a pasta _scripts_ e dentro dela crie o arquivo *create_db.sh.js*, seu
contéudo será: 

```bash
  #!/bin/bash
  set -e

  POSTGRES="psql --username postgres"

  echo "Creating database mochilarouter"

  $POSTGRES <<EOSQL
  CREATE DATABASE mochilarouter OWNER postgres;
  EOSQL

  echo "Creating database mochilarouter_test"

  $POSTGRES <<EOSQL
  CREATE DATABASE mochilarouter_test OWNER postgres;
  EOSQL
```

Esse script executa dois comandos, um para criar o database `mochilarouter` e outro para criar outro database `mochilarouter_test`.

Agora é preciso construír a imagem com o comando `docker build -t usuario/postgres .`. O docker vai gerar uma imagem com o nome passado após a opção `-t`.

No meu caso, eu criei a imagem com o nome `alemanoelsilva/postgres`. 

Falta apenas criar um container a partir dessa imagem, execute o comando: 

```bash
docker run --name alemanoelsilva-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -d alemanoelsilva/postgres
```

> Lembrando, altere o nome da imagem e container de acordo com o que você definiu.

Pronto, vamos criar testes agora?

### Criando nossos primeiros testes

Um benefício que temos ao utilizar essa ideia de arquitetura, é que podemos fazer testes unitários que podem testar cada componente de forma simples e prática. 

Os nossos testes estarão separados em 4 arquivos, sendo eles: 

  - itinerary-adapter.spec.js
  - itinerary-repository.spec.js
  - handler-error.spec.js
  - handler-success.spec.js

#### Itinerary Adapter

Dentro da pasta _test_, crie outra pasta chamada _unit_ e dentro dessa pasta crie nosso primeiro arquivo de teste `itinerary-adapter.spec.js`.
Vamos voltar ao nosso adapter, quais as dependências que ele recebe? 

![adapter itinerary]()

Como podemos ver, nosso adapter recebe 4 parâmetros, _payload_, _repository_, _onSuccess_, e _onError_.

Podemos criar um mock para simular esses objetos. Algo como: 

```js
  const mock = {
    repository: {
      saveItinerary: jest.fn(obj => obj)
    },
    payload: {
      // dados do payload
    },
    onSuccess: jest.fn(),
    onError: jest.fn(err => ({
      name: err.name || 'IntervalServerError',
      message: err.message || 'internal server error',
      details: err.details || [err],
      status_code: err.status || 500
    }))
  };
```

Temos um mock com exatamente os 4 objetos que o adapter recebe. Excluindo a propriedade payload, as demais são funções, então utilizamos o `jest.fn()` que funciona de maneira parecida a função `spy` do [sinon](http://sinonjs.org/releases/v4.2.2/spies/). Basicamente, podemos executar o adapter e conseguimos validar se as funções saveItinerary, onSuccess e onError foram executadas ou não, ou se foram executadas 1 ou mais vezes.

Para entender melhor, o seguinte teste valida o cenário de sucesso:

```js
  test('Should create an Itinerary with success', async () => {
    await createItinerary(mock);

    expect(mock.repository.saveItinerary).toHaveBeenCalledTimes(1);
    expect(mock.onSuccess).toHaveBeenCalledTimes(1);
    expect(mock.onError).toHaveBeenCalledTimes(0);
  });
```

Executamos a função _createItinerary_ passando o nosso mock e em seguida, validamos se as funções _saveItinerary_ e _onSuccess_ foram chamadas 1 vez, e que a função _onError_ não foi chamada.

O nosso segundo teste valida o cenário de erro:

```js
  test('Should return an error, invalid Itinerary', async () => {
    mock.repository.saveItinerary = () => Promise.reject(new Error('invalid Itinerary'));

    const response = await createItinerary(mock);

    expect(mock.onSuccess).toHaveBeenCalledTimes(0);
    expect(mock.onError).toHaveBeenCalledTimes(1);

    expect(response).toHaveProperty('status_code', 'name', 'message', 'details');
    expect(response.status_code).toEqual(500);
    expect(response.message).toEqual('invalid Itinerary');
  });
```

A primeira coisa que fizemos foi modificar a função `saveItinerary`, como essa função é assincrona, nos então retornamos uma promessa com um erro `Promise.reject(...)`. No adapter, ao executar `await repository.saveItinerary(payload);` e for devolvido um erro, esse erro será tratado no nosso catch, e por fim, nossa função _onError_ devolve um erro formatado. 

Verificamos que _onSuccess_ não é chamado, e _onError_ é chamado uma única vez.

A seguir validamos nosso response, de fato ele contém um objeto de erro.

Por fim, nosso arquivo _itinerary-adapter.spec.js_ será assim: 

```js
  'use strict';

  const { createItinerary } = require('../../api/itinerary/adapter');

  const payload = {
    name: 'Teste',
    isPrivate: true,
    description: 'Descrição roteiro para teste',
    duration: 5,
    user: 'email_para_teste@gmail.com',
    places: [{
      name: 'Place 1',
      attraction: 'Atração 1'
    }]
  };

  describe('Itinerary Adapter Unit tests', () => {
    const mock = {
      repository: {
        saveItinerary: jest.fn(obj => obj)
      },
      payload,
      onSuccess: jest.fn(),
      onError: jest.fn(err => ({
        name: err.name || 'IntervalServerError',
        message: err.message || 'internal server error',
        details: err.details || [err],
        status_code: err.status || 500
      }))
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('Create an Itinerary', () => {
      test('Should create an Itinerary with success', async () => {
        await createItinerary(mock);

        expect(mock.repository.saveItinerary).toHaveBeenCalledTimes(1);
        expect(mock.onSuccess).toHaveBeenCalledTimes(1);
        expect(mock.onError).toHaveBeenCalledTimes(0);
      });

      test('Should return an error, invalid Itinerary', async () => {
        mock.repository.saveItinerary = () => Promise.reject(new Error('invalid Itinerary'));

        const response = await createItinerary(mock);

        expect(mock.onSuccess).toHaveBeenCalledTimes(0);
        expect(mock.onError).toHaveBeenCalledTimes(1);

        expect(response).toHaveProperty('status_code', 'name', 'message', 'details');
        expect(response.status_code).toEqual(500);
        expect(response.message).toEqual('invalid Itinerary');
      });
    });
  });
```

> Faltou explicar a função `jest.clearAllMocks()`, Ela é bem simples, a cada teste executado essa função é executado para limpar os nossos mocks. Se essa função não fosse chamada, no segundo teste, a validação `expect(mock.onSuccess).toHaveBeenCalledTimes(0);` retornaria erro, porque no primeiro teste a função onSuccess foi chamada.

Antes de executar o comando `npm run test:unit`, vamos incluir a variavel *POSTGRES_DATABASE_TEST=mochilarouter_test* no nosso arquivo _.env_. Então execute o comando anterior, se tudo estiver ok, você deve ver algo como: 

![unit teste itinerary adapter]()

#### Itinerary Repository
#### Handler Success 
#### Handler Error

### Cobertura dos testes

### Github

Para ficar mais fácil obter todos os arquivos de cada post, vou sempre separa-los por branch [ft/implementationTestsOfCreateItinerary](https://github.com/alemanoelsilva/mochila-router-api/tree/ft/implementationTestsOfCreateItinerary)

### Próximos passos

No próximo post vamos efetuar testes integrados da API. 

Até a próxima.
