/**
 * The entry point of the app
 */
import express from "express";

const app = express();

app.use(express.json())

app.get("/", (req, res) => {
    res.json("Welcome to the talent incubator backend. Let's fun")
})

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001

app.listen(PORT, () => console.log(`Server started on port ${PORT}\nUrl: http://localhost:3001`))




