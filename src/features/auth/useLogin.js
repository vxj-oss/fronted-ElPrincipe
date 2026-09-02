import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function useLogin() {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.nombre_usuario.trim()) {
      errors.nombre_usuario = 'El nombre de usuario es requerido';
    }
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const result = await login(formData.nombre_usuario.trim(), formData.password);
    if (result.ok) {
      navigate('/dashboard');
    }
  };

  return {
    formData,
    fieldErrors,
    loading,
    error: authError,
    handleChange,
    handleSubmit,
  };
}