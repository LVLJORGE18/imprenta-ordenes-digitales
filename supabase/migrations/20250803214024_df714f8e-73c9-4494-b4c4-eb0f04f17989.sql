-- Actualizar las políticas RLS para permitir que usuarios de producción vean órdenes
-- pero solo puedan actualizar el estado de producción, no crear nuevas

-- Eliminar política restrictiva de creación
DROP POLICY IF EXISTS "Los usuarios autenticados pueden crear órdenes" ON public.orders;

-- Crear nueva política que solo permite a usuarios específicos crear órdenes
CREATE POLICY "Solo usuarios de estación pueden crear órdenes" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('Administrador', 'Estación de Trabajo')
  )
  AND auth.uid() = created_by
);

-- Actualizar política de actualización para permitir que usuarios de producción 
-- marquen órdenes como completadas
DROP POLICY IF EXISTS "Los usuarios autenticados pueden actualizar órdenes" ON public.orders;

CREATE POLICY "Usuarios pueden actualizar según su rol" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Administradores pueden actualizar todo
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'Administrador'
    )
    OR 
    -- Usuarios de estación pueden actualizar sus propias órdenes
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'Estación de Trabajo'
      )
      AND created_by = auth.uid()
    )
    OR 
    -- Usuarios de producción pueden actualizar estado de producción
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role LIKE 'estación %'
    )
  )
);