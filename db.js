const moment = require("moment");
const { Pool } = require("pg");

const fechaActual = moment();

const config = {
    host : process.env.HOST,
    port : process.env.PORT,
    database : process.env.DATABASE,
    user : process.env.USER,
    password : process.env.PASS
}

const pool = new Pool(config);

async function transaccion(cuenta1, cuenta2, monto, descripcion, fecha)
{
    const cliente = await pool.connect();
    
    try 
    {
        await cliente.query("BEGIN");

        const descontar =  "UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2";
        values = [monto, cuenta1];
        await cliente.query(descontar, values);

        const aumentar =  "UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2";
        values = [monto, cuenta2];
        await cliente.query(aumentar, values);

        const registro = "INSERT INTO transferencias(descripcion, fecha, monto, cuenta_origen, cuenta_destino) VALUES($1,$2,$3,$4,$5) RETURNING *";
        values = [descripcion, fecha, monto, cuenta1, cuenta2]
        await cliente.query(registro, values);

        //Terminar Transaccion
        await cliente.query("COMMIT")
        console.log("Descuento realizado con éxito:");
        console.log("Acreditación realizada con éxito");
        console.log("Registro guardado con exito");

    } 
    catch (error) 
    {
        await cliente.query("ROLLBACK")
        console.error(error)
    }
    finally
    {
        cliente.release()
        console.log("Termino Transaccion")
    }
}


const consultaTransferencia = async (id) =>
{
    try 
    {
        const querySearch = "SELECT * FROM transferencias WHERE cuenta_origen= $1 OR cuenta_destino = $1";
        values = [id]
        
        const result = await pool.query(querySearch, values);
        console.log(result.rows);
    } 
    catch (error) 
    {
        const { code } = error;
        console.log(code);
    }
}

const consultaSaldo = async (id) =>
{
    try 
    {
        const querySearch = "SELECT * FROM cuentas WHERE id = $1";
        values = [id]
        
        const result = await pool.query(querySearch, values);
        console.log(result.rows);
    } 
    catch (error) 
    {
        const { code } = error;
        console.log(code);
    }
}

const funciones = {
    transaccion : transaccion,
    consultaTransferencia : consultaTransferencia,
    consultaSaldo : consultaSaldo
}

function ejecutar()
{
    const funcion = process.argv[2];
    const cuenta1 = Number(process.argv[3]);
    const cuenta2 = Number(process.argv[4]);
    const monto = Number(process.argv[5]);
    const descripcion = process.argv[6];
    const fecha = fechaActual.format("DD/MM/YYYY");

    funciones[funcion](cuenta1, cuenta2, monto, descripcion, fecha);
}

ejecutar();
