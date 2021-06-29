import 'dotenv-safe/config.js';
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import prismaClient from '@prisma/client';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './resolvers/users.js';
import { TodoResolver } from './resolvers/todos.js';
import express from 'express';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import session from 'express-session';
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

const RedisStore = connectRedis(session);
const redis = new Redis(process.env.REDIS_URL);
app.set('trust proxy', 1);
app.use(
    session({
        name: 'qid',
        store: new RedisStore({
            client: redis,
            disableTouch: true,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 7, // 7 years
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        },
        saveUninitialized: false,
        secret: process.env.SECRET,
        resave: true,
    })
);

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
