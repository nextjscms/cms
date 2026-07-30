const {neon} = require('@neondatabase/serverless');
const {drizzle} = require('drizzle-orm/neon-http');
const {sql: dSql} = require('drizzle-orm');
const sql = neon('postgresql://neondb_owner:npg_jD6NJcv9YeVa@ep-falling-dust-ayo6gi2c-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
const db = drizzle(sql);

async function run() {
  try {
    const res = await db.execute(dSql`SELECT 1 as num`);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
run();
