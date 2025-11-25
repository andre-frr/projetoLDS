import express from "express";
import {ApolloServer} from "@apollo/server";
import {expressMiddleware} from "@as-integrations/express5";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import {typeDefs} from "./schema.js";
import {resolvers} from "./resolvers.js";

dotenv.config();

const app = express();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
        {
            async requestDidStart() {
                return {
                    async didResolveOperation(requestContext) {
                        console.log(
                            `[GraphQL] Query: ${requestContext.operationName || "anonymous"}`
                        );
                    },
                    async didEncounterErrors(requestContext) {
                        console.error("[GraphQL] Errors:", requestContext.errors);
                    },
                };
            },
        },
    ],
});
await server.start();
console.log("[GraphQL] Apollo Server started successfully");

app.use("/graphql", cors(), bodyParser.json(), expressMiddleware(server));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[GraphQL] ✅ Server ready at http://localhost:${PORT}/graphql`);
    console.log("[GraphQL] GraphQL Playground available");
});
