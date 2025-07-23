-- Crear usuario de producción en la tabla profiles
-- Nota: El usuario debe ser creado manualmente en auth.users desde el dashboard de Supabase
-- Este script solo agrega el perfil correspondiente

INSERT INTO public.profiles (user_id, username, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid, -- ID temporal, será reemplazado
  'vinilimprenta_ortega',
  'Vinil Imprenta Ortega',
  'estación 1'
);

-- Agregar campo para marcar trabajos como listos para entrega
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS production_status text DEFAULT 'Pendiente',
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.profiles(id);

-- Crear índice para consultas de producción
CREATE INDEX IF NOT EXISTS idx_orders_production_status ON public.orders(production_status);