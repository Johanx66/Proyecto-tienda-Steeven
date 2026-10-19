import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email inválido'),
  contrasenia: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  email: z.string().min(1, 'Email requerido').email('Email inválido'),
  telefono: z
    .string()
    .min(1, 'Teléfono requerido')
    .regex(/^\+?[0-9]{8,15}$/, 'Teléfono inválido (ej: +521234567890)'),
  contrasenia: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.contrasenia === data.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
});
