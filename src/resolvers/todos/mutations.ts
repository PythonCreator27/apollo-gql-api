import { UserInputError } from 'apollo-server';
import { Context } from '../../types';
import auth from '../utils/auth.js';
import { TodoDoesNotExistError } from './errors.js';

export const addTodo = async (
    _parent: any,
    { text }: { text: string },
    { req, prisma }: Context
) => {
    const user = await auth(req, prisma);
    return await prisma.todo.create({
        data: { text, user: { connect: { id: user.id } } },
    });
};

export const deleteTodo = async (
    _parent: any,
    { id }: { id: number },
    { req, prisma }: Context
) => {
    const user = await auth(req, prisma);
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo || todo.userId !== user.id) {
        throw new TodoDoesNotExistError(`Cannot delete todo ${id} as it does not exist.`);
    }
    return await prisma.todo.delete({ where: { id } });
    // This function used to use `if (e instanceof prismaRuntime.PrismaClientKnownRequestError && e.code === 'P2025')` (to check if the todo didn't exist)
    // but it got refactored to fetch the todo, do some checks, and then delete. The refactor is due to auth.
};

export const updateTodo = async (
    _parent: any,
    { id, text, done }: { id: number; text?: string; done?: boolean },
    { req, prisma }: Context
) => {
    if (done == null && text == null) {
        throw new UserInputError('Cannot update todo when no fields provided to update.');
    }
    const user = await auth(req, prisma);
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo || todo.userId !== user.id) {
        throw new TodoDoesNotExistError(`Cannot update todo ${id} as it does not exist.`);
    }

    return await prisma.todo.update({
        where: { id },
        data: { done: done ?? undefined, text: text ?? undefined },
    });
    // This function used to use `if (e instanceof prismaRuntime.PrismaClientKnownRequestError && e.code === 'P2025')` (to check if the todo didn't exist)
    // but it got refactored to fetch the todo, do some checks, and then update. The refactor is due to auth.
};
