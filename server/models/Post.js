const { ObjectId } = require("mongodb");
const { database } = require("../config/mongoConnection");

class Post {
  static collection() {
    return database.collection("posts");
  }

  static async findAll() {
    const posts = await this.collection()
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    return posts;
  }

  static async findById(id) {
    const post = await this.collection().findOne({ _id: new ObjectId(id) });
    return post;
  }

  static async create(newPost) {
    if (!newPost.content) throw new Error("Content is required");
    if (!newPost.authorId) throw new Error("AuthorId is required");

    newPost.tags = newPost.tags || [];
    newPost.comments = [];
    newPost.likes = [];
    newPost.createdAt = new Date();
    newPost.updatedAt = new Date();
    newPost.authorId = new ObjectId(newPost.authorId);

    const result = await this.collection().insertOne(newPost);

    return {
      _id: result.insertedId,
      ...newPost,
    };
  }

  static async addComment(postId, comment) {
    if (!comment.content) throw new Error("Comment content is required");
    if (!comment.username) throw new Error("Comment username is required");

    comment.createdAt = new Date();
    comment.updatedAt = new Date();

    await this.collection().updateOne(
      { _id: new ObjectId(postId) },
      {
        $push: { comments: comment },
        $set: { updatedAt: new Date() },
      }
    );

    return comment;
  }

  static async addLike(postId, like) {
    if (!like.username) throw new Error("Like username is required");

    const post = await this.findById(postId);
    if (!post) throw new Error("Post not found");

    const existingLike = post.likes.find((l) => l.username === like.username);

    if (existingLike) {
      await this.collection().updateOne(
        { _id: new ObjectId(postId) },
        {
          $pull: { likes: { username: like.username } },
          $set: { updatedAt: new Date() },
        }
      );
      return existingLike;
    }

    like.createdAt = new Date();
    like.updatedAt = new Date();

    await this.collection().updateOne(
      { _id: new ObjectId(postId) },
      { $push: { likes: like }, $set: { updatedAt: new Date() } }
    );

    return like;
  }

  static async getPostWithAuthor(id) {
    const agg = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "comments.username",
          foreignField: "username",
          as: "comments.user",
        },
      },
      { $unwind: { path: "$comments.user", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          content: { $first: "$content" },
          tags: { $first: "$tags" },
          imgUrl: { $first: "$imgUrl" },
          authorId: { $first: "$authorId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          author: {
            $first: {
              _id: "$author._id",
              username: "$author.username",
              name: "$author.name",
            },
          },
          comments: {
            $push: {
              $cond: [
                { $ifNull: ["$comments.username", false] },
                {
                  content: "$comments.content",
                  username: "$comments.username",
                  createdAt: "$comments.createdAt",
                  updatedAt: "$comments.updatedAt",
                  user: {
                    _id: "$comments.user._id",
                    username: "$comments.user.username",
                    name: "$comments.user.name",
                  },
                },
                "$$REMOVE",
              ],
            },
          },
          likes: { $first: "$likes" },
        },
      },
      { $unwind: { path: "$likes", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "likes.username",
          foreignField: "username",
          as: "likes.user",
        },
      },
      { $unwind: { path: "$likes.user", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          content: { $first: "$content" },
          tags: { $first: "$tags" },
          imgUrl: { $first: "$imgUrl" },
          authorId: { $first: "$authorId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          author: { $first: "$author" },
          comments: { $first: "$comments" },
          likes: {
            $push: {
              $cond: [
                { $ifNull: ["$likes.username", false] },
                {
                  username: "$likes.username",
                  createdAt: "$likes.createdAt",
                  updatedAt: "$likes.updatedAt",
                  user: {
                    _id: "$likes.user._id",
                    username: "$likes.user.username",
                    name: "$likes.user.name",
                  },
                },
                "$$REMOVE",
              ],
            },
          },
        },
      },
    ];

    const posts = await this.collection().aggregate(agg).toArray();
    return posts[0] || null;
  }

  static async getPostsWithAuthor() {
    const agg = [
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "comments.username",
          foreignField: "username",
          as: "comments.user",
        },
      },
      { $unwind: { path: "$comments.user", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          content: { $first: "$content" },
          tags: { $first: "$tags" },
          imgUrl: { $first: "$imgUrl" },
          authorId: { $first: "$authorId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          author: {
            $first: {
              _id: "$author._id",
              username: "$author.username",
              name: "$author.name",
            },
          },
          comments: {
            $push: {
              $cond: [
                { $ifNull: ["$comments.username", false] },
                {
                  content: "$comments.content",
                  username: "$comments.username",
                  createdAt: "$comments.createdAt",
                  updatedAt: "$comments.updatedAt",
                  user: {
                    _id: "$comments.user._id",
                    username: "$comments.user.username",
                    name: "$comments.user.name",
                  },
                },
                "$$REMOVE",
              ],
            },
          },
          likes: { $first: "$likes" },
        },
      },
      { $unwind: { path: "$likes", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "likes.username",
          foreignField: "username",
          as: "likes.user",
        },
      },
      { $unwind: { path: "$likes.user", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          content: { $first: "$content" },
          tags: { $first: "$tags" },
          imgUrl: { $first: "$imgUrl" },
          authorId: { $first: "$authorId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          author: { $first: "$author" },
          comments: { $first: "$comments" },
          likes: {
            $push: {
              $cond: [
                { $ifNull: ["$likes.username", false] },
                {
                  username: "$likes.username",
                  createdAt: "$likes.createdAt",
                  updatedAt: "$likes.updatedAt",
                  user: {
                    _id: "$likes.user._id",
                    username: "$likes.user.username",
                    name: "$likes.user.name",
                  },
                },
                "$$REMOVE",
              ],
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const posts = await this.collection().aggregate(agg).toArray();
    return posts;
  }

  static async deleteById(id) {
    const result = await this.collection().deleteOne({
      _id: new ObjectId(id),
    });
    return result.deletedCount > 0;
  }
}

module.exports = Post;
