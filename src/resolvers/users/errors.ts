import { ApolloError } from 'apollo-server';

export class InvalidTokenError extends ApolloError {
    name = 'InvalidTokenError';
    constructor(message: string) {
        super(message, 'INVALID_TOKEN');
    }
}

export class AuthenticationFailureError extends ApolloError {
    name = 'AuthenicationFailureError';
    constructor(message: string) {
        super(message, 'AUTH_FAILURE');
    }
}
