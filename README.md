# ZPG

### Simple Postgres Editor

If you are mostly working with Postgres database programming, this tool for you.

**ZPG** an experimental side project written with [NodeJS](https://nodejs.org) and [Webix](https://webix.com) ([GPL license](https://www.npmjs.com/package/webix)), inspired by Jenkins and PgAdmin add some features to make it simple and easy.
For more other functionality of Postgres please use PgAdmin

Features idea:

- Easy to navigate
- Task SQL continues integration
- Comparing between SQL function direct correction
- Simple query editor
- Copy content between database
- Easy view table content
- Generator
- and more..

### Documentation

https://finzaiko.github.io/zpg

>On progress...

You can try to [Quick Start](#quick_start)

### Requirement

- Node
- Postgres version 9.6 or above


### Install

Download [here](https://github.com/finzaiko/zpg/releases/tag/0.0.17-dev) and install


or manual install

```
git clone `https://github.com/finzaiko/zpg.git`
```

```
make install
```

```
npm install
cd backend && npm install
cd frontend && npm install

```

#### Change ENV config

```
cd backend && cp .env.example .env
```

#### Run

```
npm run dev
```
or
```
make start-dev-server
```

or try desktop

```
make start-dev-desktop
```

#### Open

```
http://localhost:8000
```

##### Login

```
username: admin
password: admin123
```


### <span id="quick_start">Quick Start<span>

1. Create Server connection
![query](assets-demo/zpg_db_server_conn.png)

2. Add DB Connection
![query](assets-demo/zpg_query_db_conn.png)


### WARNING !

This is an experiment personal project, found some bug and under development, you can submit the issue.

#### One Screenshot

Query

![query](assets-demo/zpg_query.png)

