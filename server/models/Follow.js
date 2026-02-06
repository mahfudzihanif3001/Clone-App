const { ObjectId } = require("mongodb");
const { database } = require("../config/mongoConnection");

class Follow {
  static collection() {
    return database.collection("follows");
  }

  static async create(followInput) {
    const { followingId, followerId } = followInput;

    if (!followingId) throw new Error("Following ID is required");
    if (!followerId) throw new Error("Follower ID is required");

    const newFollow = {
      followingId: new ObjectId(followingId),
      followerId: new ObjectId(followerId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection().insertOne(newFollow);

    return {
      _id: result.insertedId,
      ...newFollow,
    };
  }

  static async findOne(filter) {
    const follow = await this.collection().findOne(filter);
    return follow;
  }

  static async find(filter = {}) {
    const follows = await this.collection().find(filter).toArray();
    return follows;
  }

  static async checkFollowing(followingId, followerId) {
    const follow = await this.collection().findOne({
      followingId: new ObjectId(followingId),
      followerId: new ObjectId(followerId),
    });
    return !!follow;
  }

  static async deleteFollow(followingId, followerId) {
    const result = await this.collection().deleteOne({
      followingId: new ObjectId(followingId),
      followerId: new ObjectId(followerId),
    });
    return result.deletedCount > 0;
  }
}

module.exports = Follow;
