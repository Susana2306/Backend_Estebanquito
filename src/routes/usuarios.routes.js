import { Router } from "express";
import { methodUsers } from "../controllers/usuarios.controller.js";
import cors from "cors";

const router= Router();

router.post("/usuarios_estebanquito", methodUsers.createUser);
router.get("/usuarios_estebanquito", methodUsers.getUsuarios);
router.get("/usuario_interes/:correo", methodUsers.getUsuario);
router.get("/usuario_transferencia/:numeroCuenta", methodUsers.getUsuarioTranferencia);
router.post("/deposito/:numeroCuenta", methodUsers.hacerDeposito);
router.post("/retiro/:numeroCuenta", methodUsers.retirar);
router.patch("/cambiarContrasena/:id", methodUsers.actualizarContraseña);
router.post("/transferir/:id", methodUsers.transferir);
router.post("/prestamo/:id", methodUsers.prestamo);
router.post("/abono/:id", methodUsers.abono);
router.get("/ultimo_deposito/:numeroCuenta", methodUsers.getUltimoDeposito);
router.get("/ultimo_retiro/:numeroCuenta", methodUsers.getUltimoRetiro);
router.get("/concepto/:numeroCuenta", methodUsers.getPrestamo);
router.get("/ultimo_abono/:numeroCuenta", methodUsers.getUltimoAbono);
router.get("/movimientos/:numeroCuenta", methodUsers.historialMovimientos);


export default router;