const API = import.meta.env.VITE_API_URL ?? 'http://192.168.43.99:5000';

export const loginRequest = async (data) => {
  const res = await fetch(`${API}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) throw new Error(json.message || "Login failed");

  return json;
};

export const registerRequest = async (data) => {
  const res = await fetch(`${API}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) throw new Error(json.message || "Register failed");

  return json;
};