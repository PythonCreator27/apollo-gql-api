# Apollo Server 3.0 + GraphQL + Prisma + TypeScript

This is a node.js graphql project using Apollo Server 3, TypeScript, Prisma 2, argon2, class-validator, TypeGraphQL, and jsonwebtoken.

## Features

-   Register
-   Login
-   Add todo
-   List todos
-   Get a single todo
-   Update todo
-   Delete a todo
-   _SECURITY!!!_ (and auth!)

## Another note

This app is not exactly feature complete. When the secret is compromised and the server can figure out that it is, it will try its best to defend, but it does not notify you. You definitely want to change this and send an email to yourself, or automatically regenerate the secret.

## DB

This project uses PostgreSQL, though it could be very easily switched to use SQLite, MongoDB, or MySQL. You will have to edit the `providers` field of the datasource in the prisma schema, and then recreate the migrations.

## Inspecting data

You can run `yarn prisma studio` to inspect the data in the database.

## Env vars

Rename `.env.example` to `.env`. Get you db connection URL, paste it in. To get the SECRET var, follow the instructions below.

### Generating SECRET env var

You can use the following snippet to generate the SECRET env var.

```bash
python3 -c 'from secrets import choice;import string;print("".join([choice(string.ascii_uppercase + string.digits) for _ in range(100)]))' | openssl base64
```

Take it, put it in `.env`, and remove all whitespace in the generated var.

## Usage

**NOTE: This project uses yarn 2 and requires yarn to be installed. However, you could get it to work with npm as well.**

Generate client using `yarn prisma generate`. Run yarn `prisma migrate dev` to both generate the client and run migrations.

Run build using `yarn build`.

Start by running `yarn start`.

Run watch build using `yarn build:watch`.

Run dev server by running `yarn dev`.

That's all!
