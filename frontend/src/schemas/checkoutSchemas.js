import { z } from 'zod';

export const checkoutSchema = z.object({
  direccion_envio: z.string().min(5, 'Ingresa una dirección válida'),
});
