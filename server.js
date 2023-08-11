require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.trx5yvh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db("e-shopping");
    const usersCollection = db.collection("users");
    const customersCollection = db.collection("customers");
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    // User sign up and sign in Api's
    app.post("/signup", async (req, res) => {
      const userData = req.body;

      // find user is exist or not
      const isExistUser = await usersCollection.findOne({
        number: userData.number,
      });
      if (isExistUser) {
        return res.status(400).send({
          message: "You have already created account with this Phone Number",
        });
      } else {
        // hashing password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        userData.password = hashedPassword;

        const result = await usersCollection.insertOne(userData);
        if (result.acknowledged == true) {
          return res.status(200).send({
            message: "Register successfully!",
          });
        } else {
          return res.status(400).send({
            message: "Register Failed!",
          });
        }
      }
    });

    app.post("/login", async (req, res) => {
      const userData = req.body;
      const isAvailableUser = await usersCollection.findOne({
        number: userData.number,
      });
      if (!isAvailableUser) {
        return res.status(400).send({
          message: "Phone Number does not exist!",
        });
      } else {
        const isPasswordMatched = await bcrypt.compare(
          userData.password,
          isAvailableUser.password
        );
        if (!isPasswordMatched) {
          return res.status(400).send({
            message: "Password is not correct!",
          });
        } else {
          const accessToken = await jwt.sign(
            { number: isAvailableUser.number },
            "tokenSecret",
            { expiresIn: "30d" }
          );
          return res.status(200).send({
            message: "Logged in successfully!",
            token: accessToken,
          });
        }
      }
    });

    app.get("/customers", async (req, res) => {
      const query = {};
      const customer = await customersCollection.find(query).toArray();
      res.send(customer);
    });

    app.post("/customers", async (req, res) => {
      const customer = req.body;
      const result = await customersCollection.insertOne(customer);
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
      const query = {};
      const order = await ordersCollection.find(query).toArray();
      res.send(order);
    });

    app.get("/products", async (req, res) => {
      const query = {};
      const product = await productsCollection.find(query).toArray();
      res.send(product);
    });


    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });



  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("E-shopping Server is running");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
