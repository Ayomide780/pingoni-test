const express = require("express");
const pingoni = require("pingoni");

const app = express();

// Replace this with your real Pingoni API key
const API_KEY = "pgn_243772bf77c7316fd93fc682d2f9d7446994e39d72854045";

app.use(pingoni(API_KEY));

app.get("/", (req, res) => {
  res.send("Hello from Pingoni test app!");
});

app.get("/users", (req, res) => {
  res.json({ users: ["alice", "bob", "charlie"] });
});

app.get("/crash", (req, res) => {
  throw new Error("This is a test error");
});

app.get("/slow", async (req, res) => {
  await new Promise(r => setTimeout(r, 2000));
  res.send("That took a while");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
