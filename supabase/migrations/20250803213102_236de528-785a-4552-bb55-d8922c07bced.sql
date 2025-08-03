-- Crear bucket para archivos de órdenes
INSERT INTO storage.buckets (id, name, public) VALUES ('order-files', 'order-files', false);

-- Crear políticas para el bucket
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden ver archivos"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden descargar archivos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

-- Crear perfil para el usuario vinil
-- Nota: Necesitarás obtener el user_id del usuario vinilimprenta@ortega.com desde la tabla auth.users
-- Por ahora crearemos una función para ayudar con esto

CREATE OR REPLACE FUNCTION create_vinil_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vinil_user_id uuid;
BEGIN
    -- Buscar el user_id del usuario vinilimprenta@ortega.com
    SELECT id INTO vinil_user_id 
    FROM auth.users 
    WHERE email = 'vinilimprenta@ortega.com';
    
    -- Si encontramos el usuario, crear el perfil
    IF vinil_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (user_id, username, name, role)
        VALUES (vinil_user_id, 'vinil_station', 'Estación de Vinil', 'estación 1')
        ON CONFLICT (user_id) DO UPDATE SET
            username = EXCLUDED.username,
            name = EXCLUDED.name,
            role = EXCLUDED.role;
    END IF;
END;
$$;

-- Ejecutar la función para crear el perfil
SELECT create_vinil_profile();

-- Limpiar la función auxiliar
DROP FUNCTION create_vinil_profile();