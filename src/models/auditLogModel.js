const { get, all, run } = require('../db');

function createAuditLog({ actorId, actorEmail, action, targetType, targetId, details }) {
  run(
    'INSERT INTO audit_logs (actor_id, actor_email, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
    [actorId ?? null, actorEmail ?? null, action, targetType ?? null, targetId ?? null, details ? JSON.stringify(details) : null]
  );
}

function getAuditLogs({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const logs = all(
    'SELECT id, actor_id, actor_email, action, target_type, target_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  const { count: total } = get('SELECT COUNT(*) AS count FROM audit_logs');
  return { logs, total };
}

module.exports = { createAuditLog, getAuditLogs };
