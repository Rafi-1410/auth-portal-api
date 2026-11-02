const { z } = require('zod');
const email = z
  .string({ error: 'email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'email is not valid' }).max(255));

const registerSchema = z.object({
  name: z
    .string({ error: 'name is required' })
    .trim()
    .min(2, 'name must be at least 2 characters')
    .max(100, 'name must be at most 100 characters'),
  email,
  gender: z.enum(['male', 'female'], { error: 'gender must be "male" or "female"' }),
  password: z
    .string({ error: 'password is required' })
    .min(8, 'password must be at least 8 characters')
    // bcrypt hanya memproses 72 byte pertama, jadi dibatasi agar tidak menyesatkan.
    .max(72, 'password must be at most 72 characters'),
});

const loginSchema = z.object({
  email,
  password: z.string({ error: 'password is required' }).min(1, 'password is required'),
});

module.exports = { registerSchema, loginSchema };
