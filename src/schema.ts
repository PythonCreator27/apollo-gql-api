import { gql } from 'apollo-server';

export const typeDefs = gql`
    directive @complexity(value: Int!, multipliers: [String!]) on FIELD_DEFINITION

    type Todo {
        id: Int!
        text: String!
        done: Boolean!
    }

    type User {
        id: Int!
        username: String!
        email: String!
    }

    type UserResponse {
        user: User!
        token: String!
    }

    type Query {
        todos: [Todo!]! @complexity(value: 10)
        todo(id: Int!): Todo! @complexity(value: 5)
        me: User @complexity(value: 10)
    }

    type Mutation {
        addTodo(text: String!): Todo! @complexity(value: 5)
        updateTodo(id: Int!, text: String, done: Boolean): Todo! @complexity(value: 10)
        deleteTodo(id: Int!): Todo! @complexity(value: 5)
        login(usernameOrEmail: String!, password: String!): UserResponse!
            @complexity(value: 10)
        register(username: String!, email: String!, password: String!): UserResponse!
            @complexity(value: 10)
    }
`;

export default typeDefs;
