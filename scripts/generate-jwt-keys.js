import crypto from 'crypto';

// Générer une clé secrète aléatoire de 64 octets (512 bits)
const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Générer les clés
const accessTokenSecret = generateSecret();
const refreshTokenSecret = generateSecret();

console.log('Clés JWT générées :');
console.log('JWT_SECRET=', accessTokenSecret);
console.log('JWT_REFRESH_SECRET=', refreshTokenSecret);
console.log('\nCopiez ces valeurs dans votre fichier .env'); 