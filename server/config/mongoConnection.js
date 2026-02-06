const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 5000,
});

const database = client.db("gc01");

module.exports = { database, client };
