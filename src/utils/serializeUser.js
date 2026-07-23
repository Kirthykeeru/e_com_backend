function serializeUser(row) {
  if (!row) return null;
  const { id, name, email, role, created_at } = row;
  return { id, name, email, role, created_at };
}

module.exports = serializeUser;
