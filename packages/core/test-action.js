const { NeonAdapter } = require('@nextjscms/adapter-neon');
const adapter = new NeonAdapter();
async function run() {
  console.log("Testing connection...");
  const res = await adapter.testConnection("postgresql://mockuser:mockpass@ep-mock-neon.mock.tech/neondb?sslmode=require");
  console.log("Result:", res);
}
run().catch(console.error);
