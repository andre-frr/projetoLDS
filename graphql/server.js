import express from 'express';
import {ApolloServer} from '@apollo/server';
import {expressMiddleware} from '@as-integrations/express5';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import {typeDefs} from './schema.js';
import {resolvers} from './resolvers.js';

dotenv.config();

const app = express();

const server = new ApolloServer({typeDefs, resolvers});
await server.start();

app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server)
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor GraphQL a correr em http://localhost:${PORT}/graphql`);
});
