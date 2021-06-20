import { hash } from 'argon2';
import { Context } from '../../types';
import jwt from 'jsonwebtoken';
import prismaRuntime from '@prisma/client/runtime/index.js';
import { verify } from 'argon2';
import { AuthenticationFailureError } from './errors.js';
import { UserInputError } from 'apollo-server';

export const register = async (
    _parent: any,
    { username, password }: { username: string; password: string },
    { prisma }: Context
) => {
    if (password.length < 8) {
        throw new UserInputError('Password not >= 8 characters.');
    } else if (username.trim().length < 4) {
        throw new UserInputError('Username not >= 4 characters.');
    }
    const hashedPassword = await hash(password);
    let user;
    try {
        user = await prisma.user.create({
            data: { password: hashedPassword, username },
        });
    } catch (error) {
        if (
            error instanceof prismaRuntime.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            // Kept in case custom logic or logging required.
            throw new Error(
                'The database failed to insert the user for unknown reasons, maybe try a different username'
            );
        } else {
            throw new Error(
                'The database failed to insert the user for unknown reasons, maybe try a different username'
            );
        }
    }

    const token = jwt.sign(
        { id: user.id, username: user.username },
        Buffer.from(process.env.SECRET, 'base64'),
        {
            expiresIn: '1h',
        }
    );

    return {
        user,
        token,
    };
};

export const login = async (
    _parent: any,
    { username, password }: { username: string; password: string },
    { prisma }: Context
) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
        // Security measure.
        throw new AuthenticationFailureError('Bad creds');
    }
    if (await verify(user.password, password)) {
        return {
            user,
            token: jwt.sign(
                {
                    username: user.username,
                    id: user.id,
                },
                Buffer.from(process.env.SECRET, 'base64'),
                { expiresIn: '1h' }
            ),
        };
    } else {
        throw new AuthenticationFailureError('Bad creds');
    }
};
