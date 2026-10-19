import { z } from 'zod';

export const productSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().optional().or(z.literal('')),
  precio: z.coerce.number().positive('Precio debe ser mayor a 0'),
  stock: z.coerce.number().int('Stock debe ser entero').min(0, 'Stock no puede ser negativo'),
  imagen_url: z.string().url('URL inválida').optional().or(z.literal('')),
});
