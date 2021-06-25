import { AuthenticationError, ApolloError } from 'apollo-server-express';
import { hash, verify } from 'argon2';
import jwt from 'jsonwebtoken';
import {
    Args,
    Ctx,
    Field,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Int,
    ArgsType,
} from 'type-graphql';
import { Context } from '../types';
import prismaRuntime from '@prisma/client/runtime/index.js';
import { isEmail, IsEmail, MaxLength, MinLength } from 'class-validator';

@ObjectType()
export class User {
    @Field(() => Int)
    id: string;

    @Field()
    username: string;

    @Field()
    email: string;
}

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

@ObjectType()
class UserResponse {
    @Field(() => User)
    user: User;

    @Field()
    token: string;
}

@ArgsType()
class LoginArgs {
    @Field()
    usernameOrEmail: string;

    @Field()
    password: string;
}

@ArgsType()
class RegisterArgs {
    @Field()
    @MinLength(4)
    @MaxLength(40)
    username: string;

    @Field()
    @IsEmail()
    email: string;

    @Field()
    @MinLength(8)
    password: string;
}

@Resolver(User)
export class UserResolver {
    @Mutation(() => UserResponse)
    async login(
        @Args()
        { usernameOrEmail, password }: LoginArgs,
        @Ctx() { prisma }: Context
    ) {
        const user = await prisma.user.findUnique({
            where: isEmail(usernameOrEmail)
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail },
        });
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
                        email: user.email,
                    },
                    Buffer.from(process.env.SECRET, 'base64'),
                    { expiresIn: '1h' }
                ),
            };
        } else {
            throw new AuthenticationFailureError('Bad creds');
        }
    }

    @Mutation(() => UserResponse)
    async register(
        @Args() { email, password, username }: RegisterArgs,
        @Ctx() { prisma }: Context
    ) {
        const hashedPassword = await hash(password);
        let user;
        try {
            user = await prisma.user.create({
                data: { password: hashedPassword, username, email },
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
            {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            Buffer.from(process.env.SECRET, 'base64'),
            {
                expiresIn: '1h',
            }
        );

        return {
            user,
            token,
        };
    }

    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, prisma }: Context) {
        if (req.headers.authorization != null) {
            const token = req.headers.authorization.split('Bearer ')[1];
            if (token != null) {
                let info;
                try {
                    info = jwt.verify(
                        token,
                        Buffer.from(process.env.SECRET, 'base64')
                    ) as {
                        id: number;
                        username: string;
                        email: string;
                    };
                } catch (err) {
                    throw new InvalidTokenError('Token invalid or expired');
                }
                // findUnique does not allow you to query by multiple fields, but we want to.
                // In most cases, if someone gets the key, all is over, but the statement below (`{ where: { id: info.id, username: info.username, email: info.email } }`)
                // prevents hackers from using a random username when creating a forged JWT. This provides a thin layer of extra security.
                const user = await prisma.user.findFirst({
                    where: { id: info.id, username: info.username, email: info.email },
                });

                // NOTE: This can only happen when some bad actor tries to hack our server. You probably want some reporting logic here.
                if (!user) {
                    // Technically, this is a UserNotFoundError, but for security purposes, this is considered this same as an invalid token.
                    // If someone stole our secret, they could create tokens on their machine and use it to figure out what users exist using this message.
                    // Therefore, the message that the user is not found is hidden. Combined with the above security measure, this provides a little
                    // extra assurance that attackers will not be able to attack user accounts so easily.
                    throw new InvalidTokenError('Token invalid or expired');
                }
                return user;
            } else {
                throw new AuthenticationError('Auth header in invalid format');
            }
        } else {
            // We could error out, but prefer not to, since people could be unauthenticated when calling this, and we don't want to scream at them for that.
            return null;
        }
    }
}
