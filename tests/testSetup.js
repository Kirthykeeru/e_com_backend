// Must be required before any src/db module so the in-memory DB path takes effect.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DB_PATH = ':memory:';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
delete process.env.SMTP_HOST;
