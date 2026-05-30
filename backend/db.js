const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1061203816',
    database: 'aiden'
});

conexion.connect((err) => {
    if (err) {
        console.error('Error de conexión:', err);
        return;
    }

    console.log('MySQL conectado');
});

module.exports = conexion;