import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

export default function CreateCashierButton() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createCashierUser = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-cashier-user', {
        body: {}
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Usuario creado exitosamente",
        description: "El usuario de caja ha sido creado con las credenciales especificadas",
      });

    } catch (error) {
      console.error('Error creating cashier user:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el usuario de caja",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      onClick={createCashierUser} 
      disabled={isCreating}
      variant="outline"
      className="w-full justify-start"
    >
      <UserPlus className="w-4 h-4 mr-2" />
      {isCreating ? "Creando usuario..." : "Crear Usuario de Caja"}
    </Button>
  );
}