// Type definitions for auth.js
export function setToken(token: string): void;
export function getToken(): string | null;
export function setUser(user: any): void;
export function getUser(): any | null;
export function isAuthenticated(): boolean;
export function isDoctor(): boolean;
export function isPatient(): boolean;
export function logout(): void;
