import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { Session } from 'express-session';

export interface Context {
    req: Request & {
        session: Session & {
            userId: number;
        };
    };
    res: Response;
    prisma: PrismaClient;
}
