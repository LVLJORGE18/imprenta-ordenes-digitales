import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CreateVinilUserButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null);

  const handleCreateUser = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-vinil-user');
      
      if (error) {
        console.error('Error creating vinil user:', error);
        toast.error('Error al crear el usuario de vinil');
        return;
      }

      if (data.success) {
        setUserCreated(true);
        setCredentials(data.credentials);
        toast.success('Usuario de producción de vinil creado exitosamente');
      } else {
        toast.error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const resetDialog = () => {
    setUserCreated(false);
    setCredentials(null);
  };

  return (
    <Dialog onOpenChange={(open) => !open && resetDialog()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <UserPlus className="w-4 h-4 mr-2" />
          Crear Usuario de Vinil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Usuario de Producción de Vinil</DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario específico para el área de producción de vinil
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!userCreated ? (
            <>
              <Alert>
                <AlertDescription>
                  Se creará un usuario con rol "estación 1" que solo podrá ver órdenes de "Impresión de Vinil" 
                  y marcar trabajos como completados.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleCreateUser}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando usuario...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Usuario creado exitosamente
                </AlertDescription>
              </Alert>
              
              {credentials && (
                <div className="space-y-3">
                  <h4 className="font-medium">Credenciales del nuevo usuario:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">
                        <strong>Email:</strong> {credentials.email}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(credentials.email)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">
                        <strong>Contraseña:</strong> {credentials.password}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(credentials.password)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Alert>
                    <AlertDescription className="text-sm">
                      Guarda estas credenciales en un lugar seguro. El usuario podrá cambiar su contraseña después del primer inicio de sesión.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVinilUserButton;