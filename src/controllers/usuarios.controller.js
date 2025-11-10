import { getConnection } from "../database/database.js";

const generarNumeroCuentaUnico= async()=>{
    const connection= await getConnection();
    const [usuarios]= await connection.query("Select * from usuario");

        let numCuenta;
        let repetido;

        do {
            numCuenta = Math.floor(Math.random() * 9000000000) + 1000000000;
            repetido = usuarios.some(u => u.numeroCuenta === numCuenta.toString());
        } while (repetido);
        
        return numCuenta.toString();

}

const createUser = async(req, res)=>{
    try{
        
        const numeroCuenta= await generarNumeroCuentaUnico();

        const{nombre, fechaNacimiento, tipoIdentificacion, numeroIdentificacion,
            tipoCuenta, apodo, correo, contrasena} = req.body;

        const valida= await UserExist(correo);

            if(valida===1){
                console.log("Ya existe un usuario asociado a este correo", valida)
                res.json({message:"Ya existe un usuario asociado a este correo", codigo: valida})
            }
            else{

            let id_tipoIdentificacion;

            if(tipoIdentificacion==="CC"){
                id_tipoIdentificacion=1
            }
            else if(tipoIdentificacion==="CE"){
                id_tipoIdentificacion=2
            }
            else{
                id_tipoIdentificacion=3
            }

            let id_tipoCuenta;

            if(tipoCuenta==="Natural"){
                id_tipoCuenta=1
            }
            else{
                id_tipoCuenta=2
            }

        const data= {numeroCuenta, nombre, fechaNacimiento, id_tipoIdentificacion, numeroIdentificacion,
            id_tipoCuenta, apodo, correo, contrasena}

        const connection= await getConnection()

        const result= await connection.query("insert into usuario set ?", [data]);

        res.json({message: "Usuario creado exitosamente"})

        }
    }
    catch(err){
        console.log(err)
        res.json({message:"Correo ya registrado"})
    }
};

const UserExist= async(correo)=>{
    try{

        const connection = await getConnection();
        const [result]= await connection.query(`Select case when count(*) >0 then true else false end as existe
            from usuario
            where correo= ?`, [correo])
        return result[0].existe

    }catch(err){

    }
}

const hacerDeposito= async (req, res)=>{
    try{
        const { numeroCuenta } = req.params;       
        const { deposito } = req.body;

        const connection = await getConnection();

        const [result] = await connection.query(
        "UPDATE usuario SET totalSaldo = totalSaldo+? WHERE numeroCuenta = ?", [deposito, numeroCuenta]);

        const data = {
            numeroCuenta: numeroCuenta, 
            id_tipoMovimiento: 4,       
            monto: deposito,
            fecha: new Date()
        };
        const [historialRecibo]= await connection.query(
            "insert into movimiento set ?", [data]);

        res.json({ message: "Depósito realizado correctamente"});

    }
    catch (err){
        console.log(err);
    }
}

const retirar= async (req, res)=>{
    try{
        const { numeroCuenta } = req.params;       
        const { retiro } = req.body;

        const connection = await getConnection();

        const[saldoTotal]= await connection.query("Select totalSaldo from usuario where numeroCuenta= ?", numeroCuenta)

        const saldoActual= saldoTotal[0].totalSaldo;

        if(saldoActual>retiro){
            const [result] = await connection.query(
            "UPDATE usuario SET totalSaldo = totalSaldo-? WHERE numeroCuenta = ?", [retiro, numeroCuenta]);

            const data = {
                numeroCuenta: numeroCuenta, 
                id_tipoMovimiento: 3,       
                monto: retiro,
                fecha: new Date()
            };

            const [historialRecibo]= await connection.query(
                "insert into movimiento set ?", [data]);

            res.json({ message: "Retiro realizado correctamente"});
        }
        else{
            res.json({message: "Saldo insuficiente para realizar el retiro"});
        }

    }
    catch (err){
        console.log(err);
    }
}

const getUsuarios= async (req, res)=>{
    try{
    
        const connection= await getConnection();
        const result= await connection.query("Select * from usuario")
        res.json(result[0])
    }
    catch (error){
        console.log(error);
    }
}

const getUsuario= async (req, res)=>{
    try{
        
        const {correo}= req.params;
        const connection= await getConnection();
        const result= await connection.query("Select * from usuario where correo= ?", [correo])
        
        const [haSaldado] = await connection.query(`
            SELECT COUNT(a.id_abono) AS total_abonos
            FROM abono AS a
            INNER JOIN prestamo AS p ON a.id_prestamo = p.id_prestamo
            INNER JOIN usuario AS u ON p.numeroCuenta = u.numeroCuenta
            WHERE u.correo = ?
            `, [correo]);

        let deuda;
        
        const total_abonos = haSaldado?.[0]?.total_abonos ?? 0;


        if(total_abonos===0){
            const [totalDeuda]= await connection.query(`select sum(p.valorPrestamo) as valorPrestamo
                from prestamo as p inner join usuario as u ON p.numeroCuenta= u.numeroCuenta 
                where u.correo=?`, [correo]);

            if (totalDeuda && totalDeuda.length > 0) {
                deuda = totalDeuda[0].valorPrestamo;
            } 
        }
        else{
            const [totalPendiente]= await connection.query(` SELECT 
        SUM(
            COALESCE(ultimo_abono.valorPendiente, p.valorPrestamo)
        ) AS total_pendiente
    FROM prestamo AS p
    INNER JOIN usuario AS u ON p.numeroCuenta = u.numeroCuenta
    LEFT JOIN (
        SELECT a1.id_prestamo, a1.valorPendiente
        FROM abono AS a1
        INNER JOIN (
            SELECT id_prestamo, MAX(id_abono) AS ultimo
            FROM abono
            GROUP BY id_prestamo
        ) AS ultimos ON a1.id_abono = ultimos.ultimo
    ) AS ultimo_abono ON p.id_prestamo = ultimo_abono.id_prestamo
    WHERE u.correo = ?
`, [correo])

            deuda = totalPendiente?.[0]?.total_pendiente ?? 0;

            console.log("La deuda del usuario es :", deuda)
        }

        res.json({generales:result[0], deuda:deuda})
        
    } 
    catch (error){
        console.log(error);
    }
}

const getUsuarioTranferencia= async (req, res)=>{
    try{
    
        const connection= await getConnection();
        const {numeroCuenta}= req.params;
        const result= await connection.query("Select nombre from usuario where numeroCuenta=?", [numeroCuenta])
        res.json(result[0])
    }
    catch (error){
        console.log(error);
    }
}


const deleteUser= async (req, res)=>{
    try{
        const {numeroCuenta}= req.params
        const connection= await getConnection();
        const result= await connection.query("delete from usuario where numeroCuenta= ?", [numeroCuenta]);
        res.json({message: "usuario eliminado"})
    }
    catch(err){
        console.log(err)
    }
}

const actualizarContraseña = async (req, res)=>{
    try{
        const { id } = req.params;       
        const { nuevaContraseña } = req.body;

        const connection = await getConnection();

        const [result] = await connection.query(
        "UPDATE usuario SET contrasena = ? WHERE correo = ?", [nuevaContraseña, id]);
    
        res.json({message: "Cambio realizado exitosamente"});

    }
    catch (err){
        console.log(err);
    }
}

const transferir= async (req, res)=>{
    const connection = await getConnection();
    await connection.beginTransaction();

    try{
        const { id } = req.params;       
        const { cuentaDestino, valor, concepto } = req.body;
        

        const [result] = await connection.query(
        "UPDATE usuario SET totalSaldo= totalSaldo-? WHERE numeroCuenta = ?", [valor, id]);
        const [recepcion]= await connection.query( 
            "UPDATE usuario SET totalSaldo= totalSaldo+? WHERE numeroCuenta = ?", [valor, cuentaDestino]);
        
        const data_Env={
            numeroCuenta: id,           
            cuentaDestino: cuentaDestino,
            id_tipoMovimiento: 1,
            monto: valor,
            concepto: concepto,
            fecha: new Date()
        };

        const [historialEnvio]= await connection.query(
            "insert into movimiento set ?", [data_Env]);

        const data_Rec = {
            numeroCuenta: cuentaDestino, 
            cuentaDestino: id,           
            id_tipoMovimiento: 2,       
            monto: valor,
            concepto: concepto,
            fecha: new Date()
        };
        const [historialRecibo]= await connection.query(
            "insert into movimiento set ?", [data_Rec]);

        await connection.commit();
        res.json({message: "Transferencia exitosa"});

    }
    catch(error){
        console.log(error)
        await connection.rollback();
    }
}

const prestamo = async(req, res) =>{
    try{
        const connection = await getConnection();
        const {id} = req.params;
        const {valorPrestamo, numeroCuotas, frecuenciaPago, concepto} = req.body;
        let id_frecuenciaPago;
        const fechaSolicitud = new Date();
        const fechaLimitePago = new Date();

        if (frecuenciaPago === "Quincenal") {
            id_frecuenciaPago = 1;
            fechaLimitePago.setDate(fechaLimitePago.getDate() + (15 * numeroCuotas));
            
        } else {
            id_frecuenciaPago = 2;
            fechaLimitePago.setMonth(fechaLimitePago.getMonth() + numeroCuotas);
        }

        const data = {
            valorPrestamo: valorPrestamo,
            numeroCuenta: id,
            numeroCuotas: numeroCuotas,
            fechaSolicitud: fechaSolicitud,
            fechaLimitePago: fechaLimitePago,
            id_frecuenciaPago: id_frecuenciaPago,
            concepto: concepto
        } ;

        const [nuevoPrestamo] = await connection.query(
            "INSERT INTO prestamo SET ?", [data]
        );

        res.json({message: "Prestamo Exitoso"})

    }catch(err){
        console.log(err)
    }
}

const abono = async(req, res)=>{
    try{
        const connection = await getConnection();
        const {id}= req.params;
        const {valorAbonado, concepto}= req.body;

        const fechaAbono= new Date();

        const [cons_Prestamo]= await connection.query("Select id_prestamo, valorPrestamo from prestamo where numeroCuenta=? AND concepto=?", [id, concepto]);
        const idPrestamo= cons_Prestamo[0].id_prestamo;
        let valorPrestamo= cons_Prestamo[0].valorPrestamo;
        
        const [haSaldado] = await connection.query(`
            SELECT COUNT(a.id_abono) AS total_abonos
            FROM abono AS a
            INNER JOIN prestamo AS p ON a.id_prestamo = p.id_prestamo
            INNER JOIN usuario AS u ON p.numeroCuenta = u.numeroCuenta
            WHERE u.numeroCuenta = ?
            `, [id]);
        
        const total_abonos = haSaldado?.[0]?.total_abonos ?? 0;

        let valorPendiente;

        if(total_abonos===0){
            valorPendiente= valorPrestamo-valorAbonado;
        }
        else{
            const [ultimoAbono] = await connection.query(
                "SELECT valorPendiente FROM abono WHERE id_prestamo = ? ORDER BY id_abono DESC LIMIT 1",
                [idPrestamo]
            );
            valorPendiente = ultimoAbono[0].valorPendiente - valorAbonado;
        }
        

        const data={
            valorAbonado: valorAbonado,
            valorPendiente: valorPendiente,
            fechaAbono: fechaAbono,
            id_prestamo: idPrestamo
        }

        const nuevoAbono= await connection.query("insert into abono set?", [data])

        res.json({message:"Abono realizado con exito :)"})

        const [result] = await connection.query(
        "UPDATE usuario SET totalSaldo= totalSaldo-? WHERE numeroCuenta = ?", [valorAbonado, id]);

    }
    catch (error){
        console.log(error)
    }
}

const getUltimoDeposito = async (req, res) => {
    try {
        const { numeroCuenta } = req.params;
        const connection = await getConnection();

        const [result] = await connection.query(
        `select monto, fecha from movimiento where numeroCuenta = ? AND id_tipoMovimiento = 4
        order by fecha desc limit 1`,[numeroCuenta]);

    if (result.length === 0) {
        return res.json({ message: "No hay depósitos registrados" });
    }

    res.json(result[0]);
    } catch (error) {
        console.log(error);
    }
};

const getUltimoRetiro = async (req, res) => {
    try {
        const { numeroCuenta } = req.params;
        const connection = await getConnection();

        const [result] = await connection.query(
        `select monto, fecha from movimiento where numeroCuenta = ? AND id_tipoMovimiento = 3
        order by fecha desc limit 1`,[numeroCuenta]);

        if (result.length === 0) {
        return res.json({ message: "No hay retiros registrados" });
        }

        res.json(result[0]);
    } catch (error) {
        console.log(error);
    }

};

const getPrestamo = async (req, res) => {
    try {
        const { numeroCuenta } = req.params;
        const connection = await getConnection();

        const [result] = await connection.query(
        `select concepto from prestamo where numeroCuenta = ?`,[numeroCuenta]);

        if (result.length === 0) {
        return res.json({ message: "No hay prestamos registrados" });
        }

        res.json(result);
    } catch (error) {
        console.log(error);
    }

};

const getUltimoAbono = async (req, res) => {
    try {
        const { numeroCuenta } = req.params;
        const connection = await getConnection();

        const [result] = await connection.query(
            `select a.valorAbonado as monto, a.fechaAbono as fecha from abono as a inner join prestamo as p on a.id_prestamo = p.id_prestamo
            where p.numeroCuenta = ? order by a.fechaAbono desc, a.id_abono desc LIMIT 1
        `, [numeroCuenta]);

        if (result.length === 0) {
            return res.json({ message: "No hay abonos registrados" });
        }

        res.json(result[0]);
    } catch (error) {
        console.log(error);
    }
};

const historialMovimientos=async(req, res)=>{
    try {
        const { numeroCuenta } = req.params;
        const connection = await getConnection();

        const[response]= await connection.query(`Select m.cuentaDestino, m.monto,
            m.concepto, m.fecha, t.tipoMovimiento 
            from movimiento as m inner join tipomovimiento as t 
            on m.id_tipoMovimiento= t.id_tipoMovimiento
            where numeroCuenta=? ORDER BY fecha DESC`, [numeroCuenta])

        if (response.length === 0) {
            return res.json({ message: "No hay movimientos registrados" });
        }

        res.json(response);
        
    } catch (error) {
        console.log(error)
    }
}


const getAbono = async (req, res) => {
    try {
        const { numeroCuenta } = req.params;

        const connection = await getConnection();

        const [result] = await connection.query(
        `SELECT 
            a.id_abono AS id_abono,
            a.valorAbonado AS valorAbonado,
            a.valorPendiente AS valorPendiente,
            a.fechaAbono AS fechaAbono,
            a.id_prestamo AS id_prestamo
        FROM abono a
        INNER JOIN prestamo p ON a.id_prestamo = p.id_prestamo
        WHERE p.numeroCuenta = ?`,
        [numeroCuenta]
        );

        res.json(result);
    } catch (error) {
        console.log(error);
    }
};


const recuperarContraseña = async (req, res) => {
    try {
        const { numeroCuenta } = req.params;
        const { cedula, nuevaContraseña } = req.body;
        const connection = await getConnection();

        const [result] = await connection.query(
            "UPDATE usuario SET contrasena = ? WHERE numeroIdentificacion = ? AND numeroCuenta = ?",
            [nuevaContraseña, cedula, numeroCuenta]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "Número de identificación o número de cuenta incorrectos" });
        }

        res.json({ message: "Cambio realizado exitosamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error en el servidor" });
    }
};



export const methodUsers= {
    createUser,
    getUsuarios,
    deleteUser,
    hacerDeposito,
    retirar,
    getUsuario,
    actualizarContraseña,
    transferir,
    prestamo,
    abono,
    getUsuarioTranferencia,
    getUltimoDeposito,
    getUltimoRetiro,
    getPrestamo,
    getUltimoAbono,
    historialMovimientos,
    getAbono,
    recuperarContraseña
}