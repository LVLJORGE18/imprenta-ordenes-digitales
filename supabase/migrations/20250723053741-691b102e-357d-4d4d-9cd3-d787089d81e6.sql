-- Agregar campos para marcar trabajos como listos para entrega
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS production_status text DEFAULT 'Pendiente',
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.profiles(id);

-- Crear índice para consultas de producción
CREATE INDEX IF NOT EXISTS idx_orders_production_status ON public.orders(production_status);