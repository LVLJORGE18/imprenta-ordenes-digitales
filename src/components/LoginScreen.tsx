import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginScreenProps {
  onLogin: (user: { username: string; role: string; name: string }) => void;
}

const USERS = [
  { username: "ivan", password: "ivan123", role: "Administrador", name: "Ivan" },
  { username: "sergio", password: "sergio123", role: "Operador", name: "Sergio" },
  { username: "david", password: "david123", role: "Supervisor", name: "David Ortega" },
  { username: "jonathan", password: "jonathan123", role: "Operador", name: "Jonathan" },
  { username: "marco", password: "marco123", role: "Operador", name: "Marco" },
];

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const { toast } = useToast();

  const handleLogin = () => {
    const user = USERS.find(u => u.username === username && u.password === password);
    
    if (user) {
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${user.name}`,
      });
      onLogin(user);
    } else {
      toast({
        title: "Error de autenticación",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y título */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Printer className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ORTEGA</h1>
          <p className="text-muted-foreground">Sistema de Gestión de Órdenes</p>
        </div>

        {/* Card de login */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!username || !password}
            >
              Iniciar Sesión
            </Button>

          </CardContent>
        </Card>

        {/* Información de usuarios */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Usuarios del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div><strong>Ivan:</strong> ivan / ivan123</div>
            <div><strong>Sergio:</strong> sergio / sergio123</div>
            <div><strong>David Ortega:</strong> david / david123</div>
            <div><strong>Jonathan:</strong> jonathan / jonathan123</div>
            <div><strong>Marco:</strong> marco / marco123</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}