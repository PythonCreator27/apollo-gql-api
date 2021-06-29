import { Request } from 'express';
import { AuthenticationFailureError } from '../users.js';
import { PrismaClient, User } from '@prisma/client';
import { Session } from 'express-session';

export const auth = async (
    req: Request & { session: Session & { userId: number } },
    prisma: PrismaClient
): Promise<User> => {
    if (!req.session.userId) throw new AuthenticationFailureError('Not authenticated');
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.userId,
        },
    });
    if (!user) {
        throw new AuthenticationFailureError('Not authenticated');
    }
    return user;
};
export default auth;
