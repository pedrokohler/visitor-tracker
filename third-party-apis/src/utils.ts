export function generateGUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0; // Generate a random hex digit
    const value = char === "x" ? random : (random & 0x3 | 0x8); // Set specific bits for UUID v4
    return value.toString(16);
  })
}