const User = require("../models/User");
const { signToken } = require("../helpers/jwt");

const typeDefs = `#graphql
  type User {
    _id: ID
    name: String
    username: String
    email: String
    password: String 
    followers: Int
  }

  type UserProfile {
    _id: ID
    name: String
    username: String
    email: String
    followers: Int
  }

  type LoginResponse {
    token: String
    user: User
  }

  type Query {
    users: [User]
    user(id: ID!): UserProfile
    searchUsers(search: String): [User]
  }

  type Mutation {
    register(name: String, username: String!, email: String!, password: String!): User
    login(username: String!, password: String!): LoginResponse
  }
`;

const resolvers = {
  Query: {
    users: async (_, __, { auth }) => {
      await auth();

      const users = await User.findAll();
      return users;
    },
    user: async (_, { id }, { auth }) => {
      await auth();

      const user = await User.findById(id);
      if (!user) return null;

      const followersCount = await User.getSubscriberCount(id);

      return {
        ...user,
        followers: followersCount,
      };
    },
    searchUsers: async (_, { search }, { auth }) => {
      await auth();

      const users = await User.searchByNameOrUsername(search);
      const usersWithFollowers = await Promise.all(
        users.map(async (user) => {
          const followersCount = await User.getSubscriberCount(user._id);
          return {
            ...user,
            followers: followersCount,
          };
        })
      );
      return usersWithFollowers;
    },
  },
  Mutation: {
    register: async (_, { name, username, email, password }) => {
      const newUser = { name, username, email, password };
      const user = await User.create(newUser);
      return user;
    },
    login: async (_, { username, password }) => {
      const user = await User.login(username, password);
      const token = signToken({ userId: user._id, username: user.username });
      return { token, user };
    },
  },
};

module.exports = { userTypeDefs: typeDefs, userResolvers: resolvers };
