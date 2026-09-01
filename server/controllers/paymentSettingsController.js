const db = require('../config/db');

const MODES = new Set(['test', 'live']);

async function ensureSettingsTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS payment_settings (
    id TINYINT PRIMARY KEY,
    payment_mode ENUM('test','live') NOT NULL DEFAULT 'test',
    updated_by INT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await db.query(`INSERT IGNORE INTO payment_settings (id, payment_mode) VALUES (1, 'test')`);
  await db.query(`CREATE TABLE IF NOT EXISTS payment_mode_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    previous_mode ENUM('test','live') NOT NULL,
    next_mode ENUM('test','live') NOT NULL,
    changed_by INT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

async function getPaymentMode() {
  await ensureSettingsTable();
  const [[settings]] = await db.query('SELECT payment_mode FROM payment_settings WHERE id = 1');
  return settings?.payment_mode === 'live' ? 'live' : 'test';
}

function publicKeyFor(mode) {
  return mode === 'live' ? process.env.PAYSTACK_LIVE_PUBLIC_KEY : process.env.PAYSTACK_TEST_PUBLIC_KEY;
}

function secretKeyFor(mode) {
  return mode === 'live' ? process.env.PAYSTACK_LIVE_SECRET_KEY : process.env.PAYSTACK_TEST_SECRET_KEY;
}

exports.getCheckoutConfig = async (_req, res) => {
  try {
    const mode = await getPaymentMode();
    const publicKey = publicKeyFor(mode);
    if (!publicKey) return res.status(503).json({ message: `Paystack ${mode} public key is not configured.` });
    res.json({ mode, public_key: publicKey });
  } catch (error) {
    console.error('payment config error:', error);
    res.status(500).json({ message: 'Unable to load payment configuration.' });
  }
};

exports.getPaymentMode = async (req, res) => {
  try {
    if (req.user?.role !== 'Super_admin') return res.status(403).json({ message: 'Not authorized' });
    res.json({ mode: await getPaymentMode() });
  } catch (error) { res.status(500).json({ message: 'Unable to load payment mode.' }); }
};

exports.updatePaymentMode = async (req, res) => {
  try {
    if (req.user?.role !== 'Super_admin') return res.status(403).json({ message: 'Not authorized' });
    const mode = req.body?.mode;
    if (!MODES.has(mode)) return res.status(400).json({ message: 'Mode must be test or live.' });
    if (!publicKeyFor(mode) || !secretKeyFor(mode)) return res.status(503).json({ message: `Paystack ${mode} keys are not configured on the server.` });
    await ensureSettingsTable();
    const previousMode = await getPaymentMode();
    await db.query('UPDATE payment_settings SET payment_mode = ?, updated_by = ? WHERE id = 1', [mode, req.user.id]);
    if (previousMode !== mode) await db.query('INSERT INTO payment_mode_audit (previous_mode, next_mode, changed_by) VALUES (?, ?, ?)', [previousMode, mode, req.user.id]);
    res.json({ mode, message: `Paystack ${mode} mode is now active.` });
  } catch (error) {
    console.error('payment mode update error:', error);
    res.status(500).json({ message: 'Unable to update payment mode.' });
  }
};

exports.getPaymentModeValue = getPaymentMode;
exports.getSecretForMode = secretKeyFor;
exports.getPublicForMode = publicKeyFor;
exports.getWebhookSecrets = () => [
  { mode: 'test', secret: process.env.PAYSTACK_TEST_SECRET_KEY },
  { mode: 'live', secret: process.env.PAYSTACK_LIVE_SECRET_KEY },
  // Backward compatibility while deployments move from the former single key.
  { mode: (process.env.PAYSTACK_SECRET_KEY || '').startsWith('sk_live_') ? 'live' : 'test', secret: process.env.PAYSTACK_SECRET_KEY },
].filter(({ secret }) => Boolean(secret));
