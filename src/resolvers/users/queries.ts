import { AuthenticationError } from 'apollo-server';
import { Context } from '../../types';
import jwt from 'jsonwebtoken';
import { AuthenticationFailureError, InvalidTokenError } from './errors.js';
import { verify } from 'argon2';

export const me = async (_parent: any, _args: any, { prisma, req }: Context) => {
    if (req.headers.authorization != null) {
        const token = req.headers.authorization.split('Bearer ')[1];
        if (token != null) {
            let info;
            try {
                info = jwt.verify(token, Buffer.from(process.env.SECRET, 'base64')) as {
                    id: number;
                    username: string;
                };
            } catch (err) {
                throw new InvalidTokenError('Token invalid or expired');
            }
            // findUnique does not allow you to query by multiple fields, but we want to.
            // In most cases, if someone gets the key, all is over, but the statement below (`{ where: { id: info.id, username: info.username } }`)
            // prevents hackers from using a random username when creating a forged JWT. This provides a thin layer of extra security.
            const user = await prisma.user.findFirst({
                where: { id: info.id, username: info.username },
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
