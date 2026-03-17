// Store token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Store user data
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Get user data
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Check if user is a doctor
export const isDoctor = () => {
  const user = getUser();
  return user?.role === 'DOCTOR';
};

// Check if user is a patient
export const isPatient = () => {
  const user = getUser();
  return user?.role === 'PATIENT';
};

// Logout user
export const logout = () => {
  removeToken();
};
