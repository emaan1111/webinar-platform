const bcrypt = require('bcryptjs');

// Generate hashed password
const password = bcrypt.hashSync('admin123', 12);

// Generate a unique ID
const userId = 'cm' + Math.random().toString(36).substring(2, 15);

// Output the SQL
console.log('Copy and paste this SQL command into psql:');
console.log('');
console.log(`INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt") VALUES ('${userId}', 'Admin User', 'admin@example.com', '${password}', 'ADMIN', NOW(), NOW());`);
console.log('');
console.log('Then you can login with:');
console.log('Email: admin@example.com');
console.log('Password: admin123');
