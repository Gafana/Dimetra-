import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const envLocalPath = path.join(root, '.env.local');

dotenv.config({ path: envPath });

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}
