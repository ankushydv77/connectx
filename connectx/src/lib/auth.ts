export type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  location?: string;
};

const STORAGE_USERS = "connectx_users";
const STORAGE_CURRENT = "connectx_user";

const getUsersFromStorage = (): AuthUser[] => {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(STORAGE_USERS);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as AuthUser[];
  } catch {
    return [];
  }
};

const saveUsersToStorage = (users: AuthUser[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
};

export const getCurrentUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_CURRENT);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: AuthUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_CURRENT, JSON.stringify(user));
};

export const logoutUser = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_CURRENT);
};

export const registerUser = async (
  userData: Omit<AuthUser, "id">,
): Promise<AuthUser> => {
  if (typeof window === "undefined") {
    throw new Error("Client-only registration is required");
  }

  const users = getUsersFromStorage();
  const existing = users.find(
    (user) => user.email.toLowerCase() === userData.email.toLowerCase(),
  );

  if (existing) {
    throw new Error("Email already registered. Try logging in.");
  }

  const newUser: AuthUser = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...userData,
  };
  users.push(newUser);
  saveUsersToStorage(users);
  setCurrentUser(newUser);
  return newUser;
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<AuthUser> => {
  if (typeof window === "undefined") {
    throw new Error("Client-only login is required");
  }

  const users = getUsersFromStorage();
  const matched = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password,
  );
  if (!matched) {
    throw new Error("Invalid email or password.");
  }

  setCurrentUser(matched);
  return matched;
};

export const updateUser = async (updatedUser: AuthUser): Promise<AuthUser> => {
  if (typeof window === "undefined") {
    throw new Error("Client-only update is required");
  }

  const users = getUsersFromStorage();
  const index = users.findIndex((user) => user.id === updatedUser.id);
  if (index === -1) {
    throw new Error("User not found");
  }

  users[index] = updatedUser;
  saveUsersToStorage(users);
  setCurrentUser(updatedUser);
  return updatedUser;
};
