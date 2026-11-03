const path = require('path');
const dotenv = require(path.resolve(__dirname, '../server/node_modules/dotenv'));
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const { connectDB } = require('../server/src/config/db');
const { User } = require('../server/src/models');

async function check() {
  await connectDB();
  const admins = await User.find({ role: 'admin' }).select('username email role createdAt');
  console.log('Admins found in DB:');
  console.log(JSON.stringify(admins, null, 2));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});

