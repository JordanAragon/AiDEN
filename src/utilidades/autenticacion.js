/*
  Autenticación local de la etapa frontend. Las cuentas viven en este navegador
  para poder probar los flujos por rol sin backend. No es seguridad real:
  cualquier persona con acceso al navegador puede leer localStorage.
*/

const STORAGE_USERS = "aiden_users";
const STORAGE_SESSION = "aiden_session";
const STORAGE_REMEMBER = "aiden_remember";
const EVENTO_SESION = "aiden-session-change";
const EVENTO_USUARIOS = "aiden-user-change";
const SALIDA_VOLUNTARIA = "aiden_salida";

export const CUENTAS_DEMO = [
  {
    id: "usr-admin",
    name: "Jordan Aragon",
    email: "jordanaragon@aiden.com",
    password: "aiden123",
    role: "admin",
    personaId: "PER-001",
  },
  {
    id: "usr-supervisor",
    name: "Laura Méndez",
    email: "supervisor@aiden.com",
    password: "aiden123",
    role: "supervisor",
    personaId: "PER-002",
  },
  {
    id: "usr-operario",
    name: "Andrés Rojas",
    email: "operario@aiden.com",
    password: "aiden123",
    role: "operario",
    personaId: "PER-003",
  },
];

const VALID_ROLES = new Set(["admin", "supervisor", "operario"]);

function emitir(nombre) {
  window.dispatchEvent(new Event(nombre));
}

function readUsers() {
  try {
    const stored = localStorage.getItem(STORAGE_USERS);
    const users = stored ? JSON.parse(stored) : [];
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.warn("No se pudieron leer las cuentas locales", error);
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  emitir(EVENTO_USUARIOS);
}

function publico(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    personaId: user.personaId || null,
    creado: user.creado || null,
    revisado: user.revisado !== false,
  };
}

export function ensureInitialUser() {
  const current = readUsers();
  const byId = new Map(current.map((user) => [user.id, user]));
  let changed = current.length === 0;

  for (const demo of CUENTAS_DEMO) {
    const existente = byId.get(demo.id);
    if (!existente) {
      byId.set(demo.id, demo);
      changed = true;
    } else if (!existente.personaId) {
      byId.set(demo.id, { ...existente, name: demo.name, personaId: demo.personaId });
      changed = true;
    }
  }

  const merged = [...byId.values()];
  if (changed) writeUsers(merged);
  return merged;
}

export function listarUsuarios() {
  return ensureInitialUser().map(publico);
}

export function actualizarUsuario(id, cambios) {
  const users = ensureInitialUser();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) throw new Error("La cuenta ya no existe.");
  if (cambios.role && !VALID_ROLES.has(cambios.role)) throw new Error("El rol seleccionado no es válido.");
  const siguiente = [...users];
  siguiente[index] = { ...users[index], ...cambios };
  writeUsers(siguiente);
  return publico(siguiente[index]);
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

  if (!user) return { ok: false, message: "El correo o la contraseña no coinciden con ninguna cuenta." };
  if (!VALID_ROLES.has(user.role)) return { ok: false, message: "La cuenta no tiene un rol válido. Pide al administrador que la revise." };

  const session = { id: user.id };
  clearSession();
  sessionStorage.removeItem(SALIDA_VOLUNTARIA);
  const targetStorage = remember ? localStorage : sessionStorage;
  targetStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  if (remember) localStorage.setItem(STORAGE_REMEMBER, "true");
  else localStorage.removeItem(STORAGE_REMEMBER);
  emitir(EVENTO_SESION);
  return { ok: true, user: publico(user) };
}

export function register({ name, email, password }) {
  const users = ensureInitialUser();
  const cleanName = String(name || "").trim().replace(/\s+/g, " ");
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (cleanName.length < 3) return { ok: false, message: "Escribe tu nombre y apellido." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { ok: false, message: "Escribe un correo válido, por ejemplo nombre@vivero.com." };
  if (cleanPassword.length < 8) return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };
  if (users.some((user) => String(user.email).toLowerCase() === normalizedEmail)) {
    return { ok: false, message: "Ya existe una cuenta con ese correo. Inicia sesión o recupera la contraseña." };
  }

  const newUser = {
    id: `usr-${Date.now().toString(36)}`,
    name: cleanName,
    email: normalizedEmail,
    password: cleanPassword,
    role: "operario",
    personaId: null,
    creado: new Date().toISOString(),
    revisado: false,
  };
  writeUsers([...users, newUser]);
  return { ok: true, user: publico(newUser) };
}

export function resetPassword(email, newPassword) {
  const users = ensureInitialUser();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const password = String(newPassword || "");
  const index = users.findIndex((user) => String(user.email || "").toLowerCase() === normalizedEmail);

  if (index === -1) return { ok: false, message: "No hay ninguna cuenta con ese correo en este navegador." };
  if (password.length < 8) return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };

  const siguiente = [...users];
  siguiente[index] = { ...users[index], password };
  writeUsers(siguiente);
  return { ok: true };
}

function readSessionId() {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION) || sessionStorage.getItem(STORAGE_SESSION);
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" && value.id ? String(value.id) : null;
  } catch (error) {
    console.warn("La sesión guardada está dañada", error);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
  sessionStorage.removeItem(STORAGE_SESSION);
}

export function getSession() {
  const id = readSessionId();
  if (!id) return null;
  const user = readUsers().find((item) => item.id === id);
  if (!user || !VALID_ROLES.has(user.role)) {
    clearSession();
    return null;
  }
  return publico(user);
}

export function logout() {
  sessionStorage.setItem(SALIDA_VOLUNTARIA, "1");
  clearSession();
  localStorage.removeItem(STORAGE_REMEMBER);
  emitir(EVENTO_SESION);
}

/* Tras cerrar sesión a propósito no se recuerda la página anterior: la
   siguiente persona que entre empieza en su propio tablero. */
export function salioVoluntariamente() {
  return sessionStorage.getItem(SALIDA_VOLUNTARIA) === "1";
}

export function getDashboardPath(role) {
  if (role === "admin") return "/dashboard-admin";
  if (role === "supervisor") return "/dashboard-supervisor";
  return "/dashboard-operario";
}

export function suscribirSesion(callback) {
  window.addEventListener(EVENTO_SESION, callback);
  window.addEventListener(EVENTO_USUARIOS, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO_SESION, callback);
    window.removeEventListener(EVENTO_USUARIOS, callback);
    window.removeEventListener("storage", callback);
  };
}
