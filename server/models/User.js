const { ObjectId } = require("mongodb");
const { database } = require("../config/mongoConnection");
const bcrypt = require("bcryptjs");
const Follow = require("./Follow");

class User {
  static collection() {
    return database.collection("users");
  }

  static async findAll() {
    const users = await this.collection().find().toArray();
    return users;
  }

  static async findById(id) {
    const user = await this.collection().findOne({ _id: new ObjectId(id) });
    return user;
  }

  static async findByUsername(username) {
    const user = await this.collection().findOne({ username });
    return user;
  }

  static async findByEmail(email) {
    const user = await this.collection().findOne({ email });
    return user;
  }

  static async searchByNameOrUsername(search = "") {
    const users = await this.collection()
      .find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      })
      .toArray();
    return users;
  }

  static async create(newUser) {
    if (!newUser.username) throw new Error("Username is required");
    if (!newUser.email) throw new Error("Email is required");
    if (!newUser.password) throw new Error("Password is required");
    if (newUser.password.length < 5)
      throw new Error("Password must be at least 5 characters");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email))
      throw new Error("Invalid email format");

    if (newUser.username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }

    const existingUsername = await this.findByUsername(newUser.username);
    if (existingUsername) throw new Error("Username already exists");

    const existingEmail = await this.findByEmail(newUser.email);
    if (existingEmail) throw new Error("Email already exists");

    newUser.password = bcrypt.hashSync(newUser.password, 10);

    const result = await this.collection().insertOne(newUser);

    return {
      _id: result.insertedId,
      ...newUser,
    };
  }

  static async login(username, password) {
    const user = await this.findByUsername(username);
    if (!user) throw new Error("Invalid username or password");

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) throw new Error("Invalid username or password");

    return user;
  }

  static async getFollowers(userId) {
    const agg = [
      { $match: { followingId: new ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "followerDetail",
        },
      },
      { $unwind: "$followerDetail" },
      {
        $project: {
          _id: 0,
          username: "$followerDetail.username",
          name: "$followerDetail.name",
        },
      },
    ];

    const followers = await database
      .collection("follows")
      .aggregate(agg)
      .toArray();
    return followers;
  }

  static async getFollowing(userId) {
    const agg = [
      { $match: { followerId: new ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "followingId",
          foreignField: "_id",
          as: "followingDetail",
        },
      },
      { $unwind: "$followingDetail" },
      {
        $project: {
          _id: 0,
          username: "$followingDetail.username",
          name: "$followingDetail.name",
        },
      },
    ];

    const following = await database
      .collection("follows")
      .aggregate(agg)
      .toArray();
    return following;
  }

  static async getSubscriberCount(userId) {
    const count = await database
      .collection("follows")
      .countDocuments({ followingId: new ObjectId(userId) });
    return count;
  }
}

module.exports = User;
