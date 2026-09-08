import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "blog.db"));

const users = [
  { email: "editor@goclaptrinh.io.vn", password: "editor123", name: "Minh Editor", role: "editor" },
  { email: "author@goclaptrinh.io.vn", password: "author123", name: "Lan Author", role: "author" },
  { email: "viewer@goclaptrinh.io.vn", password: "viewer123", name: "Hùng Viewer", role: "viewer" },
];

const insert = db.prepare(
  "INSERT OR IGNORE INTO users (email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?)"
);

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 12);
  insert.run(u.email, hash, u.name, u.role, new Date().toISOString());
}
console.log(`✓ Đã thêm ${users.length} người dùng test`);