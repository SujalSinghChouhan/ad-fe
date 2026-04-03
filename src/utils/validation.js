export const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Must contain at least one number";
  return "";
};

export const validatePhone = (phone) => {
  if (!phone.trim()) return "Phone number is required";
  if (!/^[6-9]\d{9}$/.test(phone)) return "Enter a valid 10-digit Indian mobile number";
  return "";
};

export const validateName = (name) => {
  if (!name.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return "";
};

export const validateRequired = (value, label) => {
  if (!value || !value.toString().trim()) return `${label} is required`;
  return "";
};
