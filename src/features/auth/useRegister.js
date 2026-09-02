import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from './authService';
import { ROLES_USUARIO } from '../../constants/appConstants';
import { validarPasswordComplejidad } from '../../utils/passwordValidation';

export function useRegister() {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        nombre_usuario: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: ROLES_USUARIO.ASESOR,
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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

        if (!formData.nombre_completo.trim()) {
            errors.nombre_completo = 'El nombre completo es requerido';
        }
        if (!formData.nombre_usuario.trim()) {
            errors.nombre_usuario = 'El nombre de usuario es requerido';
        }
        if (!formData.email.trim()) {
            errors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Correo electrónico no válido';
        }
        if (!formData.password) {
            errors.password = 'La contraseña es requerida';
        } else {
            const passErr = validarPasswordComplejidad(formData.password);
            if (passErr) errors.password = passErr;
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await authService.register({
                nombre_completo: formData.nombre_completo.trim(),
                nombre_usuario: formData.nombre_usuario.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                rol: formData.rol,
            });

            navigate('/login');
        } catch (err) {
            setError(err.message || 'No se pudo completar el registro');
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        fieldErrors,
        loading,
        error,
        handleChange,
        handleSubmit,
    };
}