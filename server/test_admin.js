import db from './db.js';
import bcrypt from 'bcryptjs';

const run = async () => {
  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  console.log("Admin email:", admin.email);
};
run();
