require("dotenv").config();
const express = require("express");
const cors = require("cors");
const interviewRoutes = require("./routes/interview");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Mohit Raj Interview Prep API is running", status: "ok" });
});

app.use("/api", interviewRoutes);

app.listen(PORT, () => {
  console.log(`✅ Mohit Raj Interview Prep backend running on http://localhost:${PORT}`);
});
