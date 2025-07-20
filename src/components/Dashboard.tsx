import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Printer,
  Scissors,
  ImageIcon,
  LogOut
} from "lucide-react";
import CreateOrderDialog from "./CreateOrderDialog";

interface User {
  username: string;
  role: string;
  name: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface Order {
  id: string;
  folio: string;
  client: string;
  workType: string;
  status: string;
  createdAt: string;
  dueDate: string;
  priority: string;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "1",
      folio: "ORD-2024-001",
      client: "Empresa ABC",
      workType: "Impresión de Lonas",
      status: "En Proceso",
      createdAt: "2024-01-15",
      dueDate: "2024-01-20",
      priority: "Alta"
    },
    {
      id: "2", 
      folio: "ORD-2024-002",
      client: "Negocio XYZ",
      workType: "Vinil de Corte",
      status: "Completado",
      createdAt: "2024-01-14",
      dueDate: "2024-01-18",
      priority: "Media"
    }
  ]);

  const [showCreateOrder, setShowCreateOrder] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado": return "default";
      case "En Proceso": return "secondary"; 
      case "Pendiente": return "outline";
      case "Urgente": return "destructive";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "destructive";
      case "Media": return "default";
      case "Baja": return "secondary";
      default: return "secondary";
    }
  };

  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === "Completado").length,
    pendingOrders: orders.filter(o => o.status === "En Proceso").length,
    urgentOrders: orders.filter(o => o.priority === "Alta").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Printer className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ImprintaOS</h1>
              <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Órdenes registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">Trabajos terminados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">En producción</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.urgentOrders}</div>
              <p className="text-xs text-muted-foreground">Prioridad alta</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Órdenes de Trabajo</CardTitle>
                    <CardDescription>Gestión de órdenes activas</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateOrder(true)} className="bg-accent hover:bg-accent/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Orden
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{order.folio}</span>
                          <Badge variant={getStatusColor(order.status) as any}>
                            {order.status}
                          </Badge>
                          <Badge variant={getPriorityColor(order.priority) as any}>
                            {order.priority}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{order.createdAt}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cliente:</p>
                          <p className="font-medium">{order.client}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tipo de Trabajo:</p>
                          <p className="font-medium">{order.workType}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Fecha límite: </span>
                        <span className="font-medium">{order.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Operaciones frecuentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => setShowCreateOrder(true)} className="w-full justify-start bg-accent hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Orden de Trabajo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Reportes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Estadísticas
                </Button>
                {user.role === "Administrador" && (
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Gestionar Usuarios
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Áreas de Producción</CardTitle>
                <CardDescription>Estado de las áreas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm">Impresión Lonas</span>
                  </div>
                  <Badge variant="default">2 trabajos</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <Printer className="w-4 h-4 text-primary" />
                    <span className="text-sm">Impresión Vinil</span>
                  </div>
                  <Badge variant="outline">0 trabajos</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <Scissors className="w-4 h-4 text-primary" />
                    <span className="text-sm">Vinil de Corte</span>
                  </div>
                  <Badge variant="secondary">1 trabajo</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateOrderDialog 
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        onOrderCreated={(newOrder) => {
          setOrders([...orders, newOrder]);
          setShowCreateOrder(false);
        }}
      />
    </div>
  );
}