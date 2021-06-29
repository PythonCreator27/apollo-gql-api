declare namespace NodeJS {
    interface ProcessEnv {
        DATABASE_URL: string;
        SECRET: string;
        REDIS_URL: string;
    }
}
