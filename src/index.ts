import 'dotenv-safe/config.js';
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import prismaClient from '@prisma/client';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './resolvers/users.js';
import { TodoResolver } from './resolvers/todos.js';
import express from 'express';
// import gqlQueryComplexity, {
//     directiveEstimator,
//     simpleEstimator,
// } from 'graphql-query-complexity';

// Workaround for slicknode/graphql-query-complexity#37
// type gqlQueryComplexityFn = typeof gqlQueryComplexity;
// const queryComplexity = (
//     gqlQueryComplexity as unknown as { default: gqlQueryComplexityFn }
// ).default;

const app = express();

const PORT = process.env.PORT || 4000;

const prisma = new prismaClient.PrismaClient();

const server = new ApolloServer({
    schema: await buildSchema({ resolvers: [UserResolver, TodoResolver] }),
    context: async ({ req, res }) => {
        return { req, res, prisma };
    },
    // validationRules: [
    //     queryComplexity({
    //         maximumComplexity: 25,
    //         estimators: [directiveEstimator(), simpleEstimator({ defaultComplexity: 1 })],
    //     }),
    // ],
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

await server.start();

server.applyMiddleware({ app });

app.listen(PORT, () => {
    console.log(`🚀 Server ready http://localhost:${PORT}`);
});
