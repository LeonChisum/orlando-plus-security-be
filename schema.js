const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLSchema,
} = require("graphql");
const { getAdmin } = require("./data/helpers/userHelpers");
const db = require("./data/config");

const AdminType = new GraphQLObjectType({
  name: "Admin",
  fields: () => ({
    admin_id: { type: GraphQLInt },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    admin: {
      type: AdminType,
      resolve(parent, args) {
        //code to get data from db / other source
        return getAdmin();
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});
