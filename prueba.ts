const bcrypt = require('bcryptjs');

// Tu contraseña en texto plano
const password = 'aguanteColon';

// La contraseña hasheada almacenada (por ejemplo, en tu base de datos)
const hashedPassword = '$2b$10$wffK1Av1qloPpwZcj0uUp.2sS6ETHuX2sI0GEljDAFa0qtuxCAbPS';

// Comparar la contraseña en texto plano con la hasheada
const isMatch = bcrypt.compareSync(password, hashedPassword);

console.log(isMatch);