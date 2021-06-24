import { UserInputError } from 'apollo-server';
import {
    Args,
    Ctx,
    Field,
    Int,
    Mutation,
    Query,
    Resolver,
    ObjectType,
    Arg,
    ArgsType,
} from 'type-graphql';
import { Context } from '../types';
import auth from './utils/auth.js';
import { ApolloError } from 'apollo-server';

@ObjectType()
export class Todo {
    @Field(() => Int)
    id: string;

    @Field()
    text: string;

    @Field(() => Boolean)
    done: boolean;
}

export class TodoDoesNotExistError extends ApolloError {
    name = 'TodoDoesNotExistError';
    constructor(message: string) {
        super(message, 'TODO_DOES_NOT_EXIST');
    }
}

@ArgsType()
class UpdateTodoArgs {
    @Field(() => Int)
    id: number;

    @Field(() => Boolean, { nullable: true })
    done?: boolean;

    @Field({ nullable: true })
    text?: string;
}

@Resolver(Todo)
export class TodoResolver {
    @Mutation(() => Todo)
    async addTodo(@Arg('text') text: string, @Ctx() { req, prisma }: Context) {
        const user = await auth(req, prisma);
        return await prisma.todo.create({
            data: { text, user: { connect: { id: user.id } } },
        });
    }

    @Mutation(() => Todo)
    async deleteTodo(@Arg('id', () => Int) id: number, @Ctx() { prisma, req }: Context) {
        const user = await auth(req, prisma);
        const todo = await prisma.todo.findUnique({ where: { id } });
        if (!todo || todo.userId !== user.id) {
            throw new TodoDoesNotExistError(
                `Cannot delete todo ${id} as it does not exist.`
            );
        }
        return await prisma.todo.delete({ where: { id } });
        // This function used to use `if (e instanceof prismaRuntime.PrismaClientKnownRequestError && e.code === 'P2025')` (to check if the todo didn't exist)
        // but it got refactored to fetch the todo, do some checks, and then delete. The refactor is due to auth
    }

    @Mutation(() => Todo)
    async updateTodo(
        @Args() { done, text, id }: UpdateTodoArgs,
        @Ctx() { prisma, req }: Context
    ) {
        if (done == null && text == null) {
            throw new UserInputError(
                'Cannot update todo when no fields provided to update.'
            );
        }
        const user = await auth(req, prisma);
        const todo = await prisma.todo.findUnique({ where: { id } });
        if (!todo || todo.userId !== user.id) {
            throw new TodoDoesNotExistError(
                `Cannot update todo ${id} as it does not exist.`
            );
        }

        return await prisma.todo.update({
            where: { id },
            data: { done: done ?? undefined, text: text ?? undefined },
        });
        // This function used to use `if (e instanceof prismaRuntime.PrismaClientKnownRequestError && e.code === 'P2025')` (to check if the todo didn't exist)
        // but it got refactored to fetch the todo, do some checks, and then update. The refactor is due to auth.
    }

    @Query(() => [Todo])
    async todos(@Ctx() { prisma, req }: Context) {
        const user = await auth(req, prisma);
        return await prisma.todo.findMany({ where: { userId: user.id } });
    }

    @Query(() => Todo)
    async todo(@Arg('id', () => Int) id: number, @Ctx() { prisma, req }: Context) {
        const user = await auth(req, prisma);

        const todo = await prisma.todo.findUnique({ where: { id } });
        if (todo !== null && todo.userId === user.id) {
            return todo;
        }
        throw new TodoDoesNotExistError(
            `Cannot query for todo ${id} since it does not exist.`
        );
    }
}
