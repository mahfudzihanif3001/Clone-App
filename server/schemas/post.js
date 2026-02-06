const { ObjectId } = require("mongodb");
const Post = require("../models/Post");
const User = require("../models/User");
const { redisClient } = require("../config/redis");

const typeDefs = `#graphql
  type User {
    _id: ID
    username: String
    name: String
  }

  type Comment {
    content: String
    username: String
    user: User
    createdAt: String
    updatedAt: String
  }

  type Like {
    username: String
    user: User
    createdAt: String
    updatedAt: String
  }

  type Post {
    _id: ID
    content: String
    tags: [String]
    imgUrl: String
    authorId: ID
    author: User
    comments: [Comment]
    likes: [Like]
    createdAt: String
    updatedAt: String
  }

  type Query {
    allposts: [Post]
    post(id: ID!): Post
  }

  type Mutation {
    addPost(content: String!, tags: [String], imgUrl: String, authorId: ID!): Post
    commentPost(postId: ID!, content: String!, username: String!): Comment
    likePost(postId: ID!, username: String!): Like
    deletePost(id: ID!): Post
  }
`;

const resolvers = {
  Query: {
    allposts: async (_, __, { auth }) => {
      await auth();

      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      const cachedPosts = await redisClient.get("posts:all");
      if (cachedPosts) {
        console.log("masuk cache");
        return JSON.parse(cachedPosts);
      }

      console.log("dari mongodb");
      const posts = await Post.getPostsWithAuthor();

      await redisClient.set("posts:all", JSON.stringify(posts), "EX", 60);
      return posts;
    },
    post: async (_, { id }, { auth }) => {
      await auth();

      const post = await Post.getPostWithAuthor(id);
      return post;
    },
  },
  Mutation: {
    addPost: async (_, { content, tags, imgUrl, authorId }, { auth }) => {
      await auth();

      const createdPost = await Post.create({
        content,
        tags,
        imgUrl,
        authorId,
      });

      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.del("posts:all");

      // Return the newly created post with aggregation lookup
      return Post.getPostWithAuthor(createdPost._id.toString());
    },
    commentPost: async (_, { postId, content, username }, { auth }) => {
      await auth();

      const comment = await Post.addComment(postId, { content, username });
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.del("posts:all");
      await redisClient.del(`post:${postId}`);

      const user = await User.findByUsername(username);
      return {
        ...comment,
        user: user ? { username: user.username, name: user.name } : null,
      };
    },
    likePost: async (_, { postId, username }, { auth }) => {
      await auth();

      const like = await Post.addLike(postId, { username });
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.del("posts:all");
      await redisClient.del(`post:${postId}`);

      const user = await User.findByUsername(username);
      return {
        ...like,
        user: user ? { username: user.username, name: user.name } : null,
      };
    },
    deletePost: async (_, { id }, { auth }) => {
      await auth();

      const post = await Post.findById(id);
      if (!post) {
        throw new Error("Post not found");
      }

      const deleted = await Post.deleteById(id);
      if (!deleted) {
        throw new Error("Failed to delete post");
      }

      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.del("posts:all");
      await redisClient.del(`post:${id}`);

      return post;
    },
  },
};

module.exports = { postTypeDefs: typeDefs, postResolvers: resolvers };
