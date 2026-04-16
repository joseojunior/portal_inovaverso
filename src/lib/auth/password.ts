import * as bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;

export async function hashPassword(value: string) {
  return bcrypt.hash(value, PASSWORD_ROUNDS);
}

export async function verifyPassword(value: string, storedHash: string) {
  return bcrypt.compare(value, storedHash);
}
