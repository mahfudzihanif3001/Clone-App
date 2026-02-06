const { ObjectId } = require("mongodb");
const Follow = require("../models/Follow");
const User = require("../models/User");

const typeDefs = `#graphql
  type Follow {
    _id: ID
    followingId: ID
    followerId: ID
    createdAt: String
    updatedAt: String
  }

  type FollowResponse {
    success: Boolean
    message: String
    user: User
  }

  type User {
    _id: ID
    name: String
    username: String
    email: String
    followers: Int
  }

  type Query {
    getUserFollows(userId: ID!): [Follow]
  }

  type Mutation {
    follow(followingId: ID!, followerId: ID!): FollowResponse
    unfollow(followingId: ID!, followerId: ID!): FollowResponse
  }
`;

const resolvers = {
  Query: {
    getUserFollows: async (_, { userId }, { auth }) => {
      await auth();

      // Get all follows where current user is the follower
      const follows = await Follow.find({
        followerId: new ObjectId(userId),
      });

      return follows;
    },
  },
  Mutation: {
    follow: async (_, { followingId, followerId }, { auth }) => {
      await auth();

      // Check if already following
      const isAlreadyFollowing = await Follow.checkFollowing(
        followingId,
        followerId
      );
      if (isAlreadyFollowing) {
        return {
          success: false,
          message: "Already following this user",
          user: null,
        };
      }

      // Create follow relationship
      await Follow.create({ followingId, followerId });

      // Get updated user with followers count
      const user = await User.findById(followingId);
      const followersCount = await User.getSubscriberCount(followingId);

      return {
        success: true,
        message: "Following user successfully",
        user: {
          ...user,
          followers: followersCount,
        },
      };
    },
    unfollow: async (_, { followingId, followerId }, { auth }) => {
      await auth();

      // Delete follow relationship
      const deleted = await Follow.deleteFollow(followingId, followerId);

      if (!deleted) {
        return {
          success: false,
          message: "Not following this user",
          user: null,
        };
      }

      // Get updated user with followers count
      const user = await User.findById(followingId);
      const followersCount = await User.getSubscriberCount(followingId);

      return {
        success: true,
        message: "Unfollowed user successfully",
        user: {
          ...user,
          followers: followersCount,
        },
      };
    },
  },
};

module.exports = { followTypeDefs: typeDefs, followResolvers: resolvers };
