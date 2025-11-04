import express from "express";
import router from "./routes/usuarios.routes.js";
import cors from "cors";

const app = express();

app.use(cors({
    origin:"http://localhost:5173"
}))

app.set("port", 3001);

app.use(express.json())

app.use(router)


export default app;