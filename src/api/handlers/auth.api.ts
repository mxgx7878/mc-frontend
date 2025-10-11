// src/api/handlers/auth.api.ts
import api from '../axios.config';

interface LoginCredentials {
  email: string;
  password: string;
}

interface ClientRegistrationData {
  name: string;
  email: string;
  password: string;
  contact_name: string;
  contact_number: string;
  shipping_address: string;
  billing_address: string;
  company_name?: string;
  profile_image?: File;
  lat: number; long: number; 
}

interface SupplierRegistrationData {
  name: string;
  email: string;
  password: string;
  contact_name: string;
  contact_number: string;
  location: string;
  delivery_radius: number;
  company_name: string;
  profile_image?: File;
}

export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    try {
        const res = await api.post('/login', credentials);
        return res.data;
      } catch (e: any) {
        const msg =
          e?.message ||
          e?.response?.data?.error ||
          (e?.status === 401 ? 'Invalid credentials' : 'Something went wrong');
        throw new Error(msg);
      }
  },

  // ✅ FIXED: Client Registration with FormData
  registerClient: async (data) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('password', data.password);
  formData.append('contact_name', data.contact_name);
  formData.append('contact_number', data.contact_number);
  formData.append('shipping_address', data.shipping_address);
  formData.append('billing_address', data.billing_address);
  if (data.company_name) formData.append('company_name', data.company_name);
  if (data.profile_image) formData.append('profile_image', data.profile_image);
  formData.append('lat', String(data.lat));    // ← send
  formData.append('long', String(data.long));  // ← send
  return api.post('/register/client', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
},

  // ✅ FIXED: Supplier Registration with FormData
  registerSupplier: async (data: SupplierRegistrationData) => {
    const formData = new FormData();
    
    // Append all fields to FormData
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('contact_name', data.contact_name);
    formData.append('contact_number', data.contact_number);
    formData.append('location', data.location);
    formData.append('company_name', data.company_name);
    
    // ✅ CRITICAL: Properly append file
    if (data.profile_image) {
      formData.append('profile_image', data.profile_image);
    }
    
    return await api.post('/register/supplier', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      },
    });
  },

  logout: async () => {
    return await api.post('/logout');
  },

  checkAuth: async () => {
    return await api.get('/user');
  },
};