// Vite/Vitest load a file as plain text with ?raw (the duplicate-key test reads the JSON files this way).
declare module '*?raw' {
  const text: string;
  export default text;
}
