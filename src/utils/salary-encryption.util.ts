import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SALARY_ENCRYPTION_KEY!.padEnd(32, '0')
const IV_LENGTH = 16;


export function encryptSalary(value: number): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(value.toString());
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptSalary(encrypted: string): number {
    const [ivHex, encryptedHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return parseFloat(decrypted.toString());
}