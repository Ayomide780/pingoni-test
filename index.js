const express = require("express");
const pingoni = require("pingoni");

const app = express();

// Replace this with your real Pingoni API key
const API_KEY = process.env.PINGONI_API_KEY;
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

app.get("/fail1", (req, res) => {
  res.status(500).send("Server error");
});

app.get("/fail2", (req, res) => {
  res.status(500).send("Server error");
});

app.get("/fail3", (req, res) => {
  res.status(500).send("Server error");
});

app.get("/slow", async (req, res) => {
  await new Promise(r => setTimeout(r, 2000));
  res.send("That took a while");
});

app.use(pingoni.errorHandler(API_KEY));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
