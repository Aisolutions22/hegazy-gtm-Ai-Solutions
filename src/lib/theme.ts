export function applyInitialTheme() {
  if (typeof window === "undefined") return;
  const t = localStorage.getItem("theme") || "light";
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function setTheme(t: "light" | "dark") {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", t);
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("theme") as "light" | "dark") || "light";
}
