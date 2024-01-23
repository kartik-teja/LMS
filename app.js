/* eslint-disable linebreak-style */
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const { Users } = require("./models/");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "looks")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response) => {
  response.render("index");
});

app.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await User.findOne({
      where: {
        username: username,
        password: password,
        role: role,
      },
    });

    if (user) {
      if (user.role == "tutor") {
        res.redirect("tutor");
      } else {
        if (user.role == "user") {
          res.redirect("user");
        } else {
          res.status(404).send("Invalid role");
        }
      }
    }
  } catch {
    res.status(401).send("Invalid credentials");
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  console.log(req.body);
  try {
    const newUser = await Users.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    });

    console.log("New user created:", newUser.toJSON());

    res.redirect("/");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = app;
