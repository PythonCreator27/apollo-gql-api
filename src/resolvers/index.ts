import { todoResolvers } from './todos/index.js';
import { userResolvers } from './users/index.js';

export const resolvers = {
    Query: {
        ...todoResolvers.Query,
        ...userResolvers.Query,
    },
    Mutation: {
        ...todoResolvers.Mutation,
        ...userResolvers.Mutation,
    },
};
