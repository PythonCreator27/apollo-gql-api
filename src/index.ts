import 'dotenv-safe/config.js';
import { ApolloServer } from 'apollo-server';
import typeDefs from './schema.js';
import { resolvers } from './resolvers/index.js';
import prismaClient from '@prisma/client';
import gqlQueryComplexity, {
    directiveEstimator,
    simpleEstimator,
} from 'graphql-query-complexity';

// Workaround for slicknode/graphql-query-complexity#37
type gqlQueryComplexityFn = typeof gqlQueryComplexity;
const queryComplexity = (
    gqlQueryComplexity as unknown as { default: gqlQueryComplexityFn }
).default;

const PORT = process.env.PORT || 4000;

const prisma = new prismaClient.PrismaClient();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, res }) => {
        return { req, res, prisma };
    },
    validationRules: [
        queryComplexity({
            maximumComplexity: 25,
            estimators: [directiveEstimator(), simpleEstimator({ defaultComplexity: 1 })],
        }),
    ],
});

const { url } = await server.listen(PORT);

if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Server ready at ${url}`);
}
