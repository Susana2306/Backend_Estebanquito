import { Router } from "express";
import { methodUsers } from "../controllers/usuarios.controller.js";
import cors from "cors";

const router= Router();

router.post("/usuarios_estebanquito", methodUsers.createUser);
router.get("/usuarios_estebanquito", methodUsers.getUsuarios);
router.get("/usuario_interes/:correo", methodUsers.getUsuario);
router.post("/deposito/:id", methodUsers.hacerDeposito);
router.post("/retiro/:id", methodUsers.retirar);
router.patch("/cambiarContrasena/:id", methodUsers.actualizarContraseña);
router.post("/transferir/:id", methodUsers.transferir);
router.post("/prestamo/:id", methodUsers.prestamo);
router.post("/abono/:id", methodUsers.abono);


export default router;