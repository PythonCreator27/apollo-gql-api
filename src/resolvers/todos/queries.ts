import { Context } from '../../types';
import auth from '../utils/auth.js';
import { TodoDoesNotExistError } from './errors.js';

export const todos = async (
    _parent: any,
    _args: any,
    /* context */ { prisma, req }: Context,
    _info: any
) => {
    const user = await auth(req, prisma);
    return await prisma.todo.findMany({ where: { userId: user.id } });
};

export const todo = async (
    _parent: any,
    { id }: { id: number },
    { req, prisma }: Context
) => {
    const user = await auth(req, prisma);

    const todo = await prisma.todo.findUnique({ where: { id } });
    if (todo !== null && todo.userId === user.id) {
        return todo;
    }
    throw new TodoDoesNotExistError(
        `Cannot query for todo ${id} since it does not exist.`
    );
};
