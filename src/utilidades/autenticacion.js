const STORAGE_USERS = "aiden_users";
const STORAGE_SESSION = "aiden_session";
const STORAGE_REMEMBER = "aiden_remember";

const INITIAL_USERS = [
  {
    id: "usr-admin",
    name: "Jordan Aragon",
    email: "jordanaragon@aiden.com",
    password: "aiden123",
    role: "admin",
  },
  {
    id: "usr-operario",
    name: "Andrés R.",
    email: "operario@aiden.com",
    password: "aiden123",
    role: "operario",
  },
  {
    id: "usr-supervisor",
    name: "Laura M.",
    email: "supervisor@aiden.com",
    password: "aiden123",
    role: "supervisor",
  },
];

const VALID_ROLES = new Set(["admin", "supervisor", "operario"]);

function readUsers() {
  try {
    const stored = localStorage.getItem(STORAGE_USERS);
    const users = stored ? JSON.parse(stored) : [];
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function sanitizeSession(value) {
  if (!value || typeof value !== "object") return null;
  if (!value.id || !value.email || !VALID_ROLES.has(value.role)) return null;
  return {
    id: String(value.id),
    name: String(value.name || "Usuario"),
    email: String(value.email).toLowerCase(),
    role: value.role,
  };
}

function readSession() {
  try {
    const persistent = localStorage.getItem(STORAGE_SESSION);
    const temporary = sessionStorage.getItem(STORAGE_SESSION);
    const session = persistent || temporary;
    return sanitizeSession(session ? JSON.parse(session) : null);
  } catch {
    return null;
  }
}

export function ensureInitialUser() {
  const current = readUsers();
  if (!current.length) {
    writeUsers(INITIAL_USERS);
    return INITIAL_USERS;
  }

  const byId = new Map(current.map((user) => [user.id, user]));
  let changed = false;
  for (const initial of INITIAL_USERS) {
    if (!byId.has(initial.id)) {
      byId.set(initial.id, initial);
      changed = true;
    }
  }

  const merged = [...byId.values()];
  if (changed) writeUsers(merged);
  return merged;
}

export function login(email, password, remember = false) {
  const users = ensureInitialUser();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");
  const user = users.find(
    (item) =>
      String(item.email || "").toLowerCase() === normalizedEmail &&
      String(item.password ?? item.clave ?? "") === rawPassword,
  );

  if (!user) return { ok: false, message: "Correo o contraseña incorrectos." };
  if (!VALID_ROLES.has(user.role)) return { ok: false, message: "La cuenta no tiene un rol válido." };

  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  logout();
  const targetStorage = remember ? localStorage : sessionStorage;
  targetStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  if (remember) localStorage.setItem(STORAGE_REMEMBER, "true");
  window.dispatchEvent(new Event("aiden-session-change"));
  return { ok: true, user: session };
}

export function register({ name, email, password }) {
  const users = ensureInitialUser();
  const cleanName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (cleanName.length < 2) return { ok: false, message: "Ingresa un nombre válido." };
  if (!normalizedEmail) return { ok: false, message: "Ingresa un correo válido." };
  if (cleanPassword.length < 8) return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };
  if (users.some((user) => String(user.email).toLowerCase() === normalizedEmail)) {
    return { ok: false, message: "Ya existe una cuenta con ese correo." };
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: cleanName,
    email: normalizedEmail,
    password: cleanPassword,
    role: "operario",
  };
  writeUsers([...users, newUser]);
  window.dispatchEvent(new Event("aiden-user-change"));
  return { ok: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } };
}

export function resetPassword(email, newPassword) {
  const users = ensureInitialUser();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const password = String(newPassword || "");
  const index = users.findIndex((user) => String(user.email || "").toLowerCase() === normalizedEmail);

  if (index === -1) return { ok: false, message: "No existe una cuenta con ese correo." };
  if (password.length < 8) return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };

  users[index] = { ...users[index], password };
  writeUsers(users);
  return { ok: true };
}

export function getSession() {
  const session = readSession();
  if (session) return session;
  localStorage.removeItem(STORAGE_SESSION);
  sessionStorage.removeItem(STORAGE_SESSION);
  return null;
}

export function logout() {
  localStorage.removeItem(STORAGE_SESSION);
  localStorage.removeItem(STORAGE_REMEMBER);
  sessionStorage.removeItem(STORAGE_SESSION);
  window.dispatchEvent(new Event("aiden-session-change"));
}

export function getDashboardPath(role) {
  return role === "admin" ? "/dashboard-admin" : role === "supervisor" ? "/dashboard-supervisor" : "/dashboard-operario";
}
