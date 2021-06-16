import { ApolloError } from 'apollo-server';

export class TodoDoesNotExistError extends ApolloError {
    name = 'TodoDoesNotExistError';
    constructor(message: string) {
        super(message, 'TODO_DOES_NOT_EXIST');
    }
}
