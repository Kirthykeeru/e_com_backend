const db = require('../db');

const createAuditLog = async ({ actorId, actorEmail, action, targetType, targetId, details }) => {
  await db.query(
    'INSERT INTO audit_logs (actor_id, actor_email, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
    [actorId, actorEmail, action, targetType || null, targetId || null, details ? JSON.stringify(details) : null]
  );
};

const getAuditLogs = async () => {
  const result = await db.query(
    `SELECT id, actor_id, actor_email, action, target_type, target_id, details, created_at
     FROM audit_logs ORDER BY created_at DESC LIMIT 200`
  );
  return result.rows;
};

module.exports = { createAuditLog, getAuditLogs };
