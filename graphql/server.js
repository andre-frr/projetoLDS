import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express";
import dotenv from "dotenv";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";

dotenv.config();

const app = express();
app.use(express.json());

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use("/graphql", expressMiddleware(server));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor GraphQL a correr em http://localhost:${PORT}/graphql`);
});
