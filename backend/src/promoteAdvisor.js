import "dotenv/config";
import { db, initSchema } from "./db.js";

// Advisor accounts can see every student's saved plans, so that role is
// deliberately NOT something the public signup form can grant (see
// routes/auth.js). This script is the intended way to promote an account:
// run it yourself, from a shell with access to the real database, after
// you've already signed up normally as a student.
//
// Usage:
//   node src/promoteAdvisor.js you@example.com
//   npm run promote-advisor -- you@example.com

const email = process.argv[2];

if (!email) {
  console.error("Usage: node src/promoteAdvisor.js <email>");
  process.exit(1);
}

initSchema();

const user = db.prepare("SELECT id, email, role FROM users WHERE email = ?").get(email.toLowerCase());

if (!user) {
  console.error(`No account found for ${email}. Sign up in the app first, then run this again.`);
  process.exit(1);
}

if (user.role === "advisor") {
  console.log(`${email} is already an advisor.`);
  process.exit(0);
}

db.prepare("UPDATE users SET role = 'advisor' WHERE id = ?").run(user.id);
console.log(`✅ ${email} is now an advisor. Sign out and back in for the change to take effect.`);
