-- Actualizar la restricción de roles para agregar "Caja"
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Agregar nueva restricción con el rol "Caja" incluido
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['Administrador'::text, 'Operador'::text, 'Supervisor'::text, 'estación 1'::text, 'estación 3'::text, 'estación 4'::text, 'Caja'::text]));

-- Agregar campos de pago a la tabla de órdenes
ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN advance_payment DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN remaining_balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - COALESCE(advance_payment, 0)) STORED;