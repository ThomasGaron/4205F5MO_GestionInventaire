import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("✅ Connecté à la base de données"))
  .catch(err => console.error("❌ Erreur de connexion BD:", err));

export default pool;
