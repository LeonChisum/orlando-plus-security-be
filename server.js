const express = require("express");
const graphqlHTTP = require("express-graphql");
const schema = require("./schema");
const configMiddleware = require('./middleware/configMiddleware')

const server = express();
const PORT = process.env.PORT || 5000;

configMiddleware(server)

server.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
