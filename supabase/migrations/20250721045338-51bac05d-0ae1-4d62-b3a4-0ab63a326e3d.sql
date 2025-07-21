-- Actualizar la restricción de roles para permitir los roles específicos de estaciones
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Agregar nueva restricción con los roles que necesitamos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['Administrador'::text, 'Operador'::text, 'Supervisor'::text, 'estación 1'::text, 'estación 3'::text, 'estación 4'::text]));