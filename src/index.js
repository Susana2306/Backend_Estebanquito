import app from "./app.js";

const main = ()=>{
    app.listen(app.get("port"))
    console.log("El servidor está escuchando en el puerto: ", app.get("port"))
}

main();