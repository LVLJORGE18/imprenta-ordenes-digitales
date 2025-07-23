-- Crear usuario Caja en auth.users (esto se debe hacer manualmente desde el dashboard)
-- Pero agregamos el perfil correspondiente en la tabla profiles

-- Insertar perfil para usuario Caja
INSERT INTO public.profiles (user_id, username, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, -- Este ID será reemplazado cuando se cree el usuario real
  'caja_usuario',
  'Usuario Caja',
  'Caja'
);

-- Agregar campos necesarios para la gestión de órdenes y pagos
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'Pendiente',
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_by uuid REFERENCES public.profiles(id);

-- Crear índice para búsquedas por folio
CREATE INDEX IF NOT EXISTS idx_orders_folio ON public.orders(folio);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);