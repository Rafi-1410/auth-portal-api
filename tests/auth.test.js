const request = require('supertest');
const jwt = require('jsonwebtoken');
const { buildTestApp, TEST_SECRET } = require('./helpers');

const validUser = {
  name: 'Budi Santoso',
  email: 'Budi@Example.com',
  gender: 'male',
  password: 'rahasia123',
};

let app;
let userRepository;

beforeEach(() => {
  ({ app, userRepository } = buildTestApp());
});

describe('POST /api/v1/auth/register', () => {
  it('membuat akun dan mengembalikan token tanpa password hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Budi Santoso', email: 'budi@example.com', gender: 'male' });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('menyimpan password dalam bentuk hash, bukan teks asli', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const [stored] = [...userRepository._users.values()];
    expect(stored.passwordHash).not.toBe(validUser.password);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('menolak email yang sudah terdaftar (case-insensitive) dengan 409', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'BUDI@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('mengembalikan 400 beserta detail field yang salah', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'B', email: 'bukan-email', gender: 'x', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field).sort();
    expect(fields).toEqual(['email', 'gender', 'name', 'password']);
  });

  it('mengembalikan 400 untuk body JSON yang rusak', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name": ');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
  });

  it('login berhasil dengan kredensial yang benar', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'budi@example.com', password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it.each([
    ['password salah', { email: 'budi@example.com', password: 'salahsalah' }],
    ['email tidak terdaftar', { email: 'tidakada@example.com', password: 'rahasia123' }],
  ])('mengembalikan 401 dengan pesan yang sama untuk %s', async (_label, body) => {
    const res = await request(app).post('/api/v1/auth/login').send(body);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });
});

describe('GET /api/v1/users/me', () => {
  it('mengembalikan profil user sesuai token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send(validUser);
    const token = reg.body.data.accessToken;

    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.data).toMatchObject({ id: reg.body.data.user.id, email: 'budi@example.com' });
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('menolak request tanpa token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('menolak token dengan signature yang salah', async () => {
    const forged = jwt.sign({}, 'secret-lain-yang-bukan-milik-server-ini-xx', { subject: 'abc' });
    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('menolak token yang sudah kedaluwarsa', async () => {
    const expired = jwt.sign({}, TEST_SECRET, { subject: 'abc', expiresIn: -10 });
    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Token expired');
  });

  it('menolak token dengan algoritma "none"', async () => {
    const unsigned = jwt.sign({}, null, { subject: 'abc', algorithm: 'none' });
    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });
});

describe('Lain-lain', () => {
  it('route tak dikenal mengembalikan 404 JSON', async () => {
    const res = await request(app).get('/api/v1/tidak-ada');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
