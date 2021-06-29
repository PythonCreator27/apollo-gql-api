import { ApolloError } from 'apollo-server-express';
import { hash, verify } from 'argon2';
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
        @Ctx() { prisma, req }: Context
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
            req.session.userId = user.id;
            return { user };
        } else {
            throw new AuthenticationFailureError('Bad creds');
        }
    }

    @Mutation(() => UserResponse)
    async register(
        @Args() { email, password, username }: RegisterArgs,
        @Ctx() { prisma, req }: Context
    ) {
        const hashedPassword = await hash(password);
        let user;
        try {
            user = await prisma.user.create({
                data: { password: hashedPassword, username, email },
            });
        } catch {
            throw new Error(
                'The database failed to insert the user for unknown reasons, maybe try again later or change your username or email address.'
            );
        }

        req.session.userId = user.id;

        return { user };
    }

    @Query(() => User, { nullable: true })
    me(@Ctx() { req, prisma }: Context) {
        if (!req.session.userId) return null;
        return prisma.user.findUnique({
            where: {
                id: req.session.userId,
            },
        });
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: Context) {
        return new Promise(resolve => {
            req.session.destroy(err => {
                res.clearCookie('qid');
                err ? resolve(false) : resolve(true);
            });
        });
    }
}
