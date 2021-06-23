import { Request } from 'express';
import { AuthenticationFailureError, InvalidTokenError } from '../users/errors.js';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';

export const auth = async (req: Request, prisma: PrismaClient): Promise<User> => {
    if (req.headers.authorization != null) {
        const token = req.headers.authorization.split('Bearer ')[1];
        if (token != null) {
            let info;
            try {
                info = jwt.verify(token, Buffer.from(process.env.SECRET, 'base64')) as {
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
                // Technically, this is a UserNotFoundError (or a null), but for security purposes, this is considered this same as an invalid token.
                // If someone stole our secret, they could create tokens on their machine and use it to figure out what users exist using this error / return value.
                // Therefore, the message that the user is not found is hidden. Combined with the security measure above (of checking for both id and username),
                // this provides a little extra assurance that attackers will not be able to attack user accounts so easily.
                throw new InvalidTokenError('Token invalid or expired');
            }
            return user;
        } else {
            throw new AuthenticationFailureError('Auth header in invalid format');
        }
    } else {
        throw new AuthenticationFailureError('Auth header not present');
    }
};
export default auth;
