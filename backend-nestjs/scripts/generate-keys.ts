import { generateKeyPairSync } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const keysDir = join(process.cwd(), 'keys');

// Create keys directory if it doesn't exist
if (!existsSync(keysDir)) {
  mkdirSync(keysDir, { recursive: true });
  console.log('📁 Created keys directory');
}

// Check if keys already exist
const privateKeyPath = join(keysDir, 'jwt-private.pem');
const publicKeyPath = join(keysDir, 'jwt-public.pem');

if (existsSync(privateKeyPath) || existsSync(publicKeyPath)) {
  console.log('⚠️  Keys already exist. Delete them first if you want to regenerate.');
  process.exit(1);
}

console.log('🔐 Generating RSA key pair for JWT...');

try {
  // Generate RSA key pair
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Write keys to files
  writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
  writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });

  console.log('✅ RSA keys generated successfully!');
  console.log(`   Private key: ${privateKeyPath}`);
  console.log(`   Public key: ${publicKeyPath}`);
  console.log('');
  console.log('⚠️  Keep the private key secure and never commit it to version control!');
} catch (error) {
  console.error('❌ Error generating keys:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
