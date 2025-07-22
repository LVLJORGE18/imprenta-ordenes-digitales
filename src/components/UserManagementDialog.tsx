import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Edit3, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  name: string;
  role: string;
  created_at: string;
}

const ROLES = [
  { value: "Administrador", label: "Administrador" },
  { value: "estación 1", label: "Estación 1" },
  { value: "estación 3", label: "Estación 3" },
  { value: "estación 4", label: "Estación 4" },
  { value: "Caja", label: "Caja" }
];

export default function UserManagementDialog({ open, onOpenChange }: UserManagementDialogProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
    role: ""
  });
  const [editForm, setEditForm] = useState({
    name: "",
    newPassword: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.username || !newUser.name || !newUser.role) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Crear perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role
          });

        if (profileError) {
          throw profileError;
        }

        toast({
          title: "Usuario creado",
          description: "El usuario se ha creado exitosamente"
        });

        setNewUser({
          email: "",
          password: "",
          username: "",
          name: "",
          role: ""
        });

        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      newPassword: ""
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editForm.name) {
      toast({
        title: "Campo requerido",
        description: "El nombre es obligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      // Actualizar perfil usando id en lugar de user_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: editForm.name
        })
        .eq('id', editingUser.id);

      if (profileError) {
        throw profileError;
      }

      // Si hay nueva contraseña, actualizarla
      if (editForm.newPassword) {
        // Nota: Esto requeriría un edge function para cambiar la contraseña de otro usuario
        // Por ahora solo mostramos un mensaje
        toast({
          title: "Actualización parcial",
          description: "El nombre se actualizó. Para cambiar la contraseña se requiere una función adicional."
        });
      } else {
        toast({
          title: "Usuario actualizado",
          description: "Los datos del usuario se han actualizado"
        });
      }

      setEditingUser(null);
      setEditForm({ name: "", newPassword: "" });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateUser = async (user: UserProfile) => {
    if (user.role === "Administrador") {
      toast({
        title: "Acción no permitida",
        description: "No se puede dar de baja a un administrador",
        variant: "destructive"
      });
      return;
    }

    try {
      // Eliminar perfil (esto desactivará efectivamente al usuario)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Usuario dado de baja",
        description: "El usuario ha sido desactivado"
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo dar de baja al usuario",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Gestión de Usuarios</span>
          </DialogTitle>
          <DialogDescription>
            Administra los usuarios del sistema
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="list" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Lista de Usuarios</TabsTrigger>
            <TabsTrigger value="create">Crear Usuario</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Cargando usuarios...</div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {user.role !== "Administrador" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateUser(user)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Dar de Baja
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Crear Nuevo Usuario</span>
                </CardTitle>
                <CardDescription>
                  Completa los datos para crear un nuevo usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Contraseña segura"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Nombre de Usuario *</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="nombre_usuario"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Nombre Apellido"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateUser} className="w-full">
                  Crear Usuario
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de edición */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuario</DialogTitle>
                <DialogDescription>
                  Modifica los datos de {editingUser.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Nombre Completo</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    placeholder="Dejar vacío para no cambiar"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateUser}>
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}