import { UserRole } from '../types';

export const canManageLinks = (role?: UserRole) => {
  return role === 'admin' || role === 'editor';
};

export const canViewAnalytics = (role?: UserRole) => {
  return role === 'admin' || role === 'editor' || role === 'viewer';
};

export const canManageUsers = (role?: UserRole) => {
  return role === 'admin';
};
