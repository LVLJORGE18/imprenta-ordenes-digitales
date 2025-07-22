import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

interface Order {
  id: string;
  folio: string;
  client: string;
  work_type: string;
  status: string;
  priority: string;
  created_by: string;
  created_at: string;
  due_date?: string;
}

interface UserProfile {
  user_id: string;
  name: string;
  username: string;
}

interface AdminOrdersViewProps {
  onOrderClick: (order: Order) => void;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export default function AdminOrdersView({ 
  onOrderClick, 
  formatDate, 
  getStatusColor, 
  getPriorityColor 
}: AdminOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchOrders();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, username')
        .order('name');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = selectedUserId === "all" 
    ? orders 
    : orders.filter(order => order.created_by === selectedUserId);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user ? user.name : 'Usuario desconocido';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Órdenes por Usuario (Admin)</span>
            </CardTitle>
            <CardDescription>Vista administrativa de todas las órdenes</CardDescription>
          </div>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.name} (@{user.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Cargando órdenes...</div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay órdenes para mostrar
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer hover:border-primary/50"
                  onClick={() => onOrderClick(order)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-primary">{order.folio}</span>
                      <Badge variant={getStatusColor(order.status) as any}>
                        {order.status}
                      </Badge>
                      <Badge variant={getPriorityColor(order.priority) as any}>
                        {order.priority}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cliente:</p>
                      <p className="font-medium">{order.client}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo de Trabajo:</p>
                      <p className="font-medium">{order.work_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Creado por:</p>
                      <p className="font-medium">{getUserName(order.created_by)}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Fecha límite: </span>
                    <span className="font-medium">{order.due_date ? formatDate(order.due_date) : 'Sin fecha límite'}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Click para ver detalles
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}