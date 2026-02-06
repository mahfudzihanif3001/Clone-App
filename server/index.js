require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { client } = require("./config/mongoConnection");

const { redisClient } = require("./config/redis");
const { verifyToken } = require("./helpers/jwt");

const { userTypeDefs, userResolvers } = require("./schemas/user");
const { postTypeDefs, postResolvers } = require("./schemas/post");
const { followTypeDefs, followResolvers } = require("./schemas/follow");
const User = require("./models/User");

const server = new ApolloServer({
  typeDefs: [userTypeDefs, postTypeDefs, followTypeDefs],
  resolvers: [userResolvers, postResolvers, followResolvers],
  introspection: true,
});

startStandaloneServer(server, {
  listen: { port: process.env.PORT || 3000 },
  context: async ({ req }) => {
    return {
      auth: async () => {
        const authorization = req.headers.authorization;
        if (!authorization) {
          throw new Error("Please login to access this resource");
        }

        const [rawType, token] = authorization.split(" ");
        const type = (rawType || "").toLowerCase();
        if (!token) {
          throw new Error("Invalid authorization format");
        }
        if (type !== "bearer") {
          throw new Error("Invalid authorization type");
        }

        try {
          const decoded = verifyToken(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId);
          if (!user) {
            throw new Error("User not found");
          }
          return user;
        } catch (err) {
          throw new Error("Invalid or expired token");
        }
      },
    };
  },
}).then(({ url }) => {
  console.log(`🚀 Server ready at: ${url}`);
});
