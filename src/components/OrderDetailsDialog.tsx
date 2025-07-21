import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  AlertCircle, 
  Folder,
  Download,
  Eye
} from "lucide-react";

interface Order {
  id: string;
  folio: string;
  client: string;
  work_type: string;
  status: string;
  priority: string;
  description?: string;
  notes?: string;
  files?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado": return "default";
      case "En proceso": return "secondary"; 
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalFiles = () => {
    if (!order.files || !Array.isArray(order.files)) return 0;
    return order.files.length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <span className="text-xl font-bold">{order.folio}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusColor(order.status) as any}>
                    {order.status}
                  </Badge>
                  <Badge variant={getPriorityColor(order.priority) as any}>
                    Prioridad {order.priority}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Creado: {formatDate(order.created_at)}</div>
              {order.due_date && <div>Entrega: {formatDate(order.due_date)}</div>}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Información del Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cliente:</label>
                <p className="font-semibold">{order.client}</p>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Trabajo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Detalles del Trabajo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Trabajo:</label>
                <p className="font-semibold">{order.work_type}</p>
              </div>
              {order.due_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fecha de Entrega:</label>
                    <p className="font-semibold">{formatDate(order.due_date)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Creación:</label>
                  <p className="font-semibold">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Descripción */}
        {order.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción del Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{order.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Notas Adicionales */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Notas Adicionales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Archivos */}
        {order.files && getTotalFiles() > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Folder className="w-5 h-5" />
                <span>Archivos de Producción</span>
                <Badge variant="outline">{getTotalFiles()} archivos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Folder className="w-4 h-4" />
                    <span>Archivos adjuntos</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.isArray(order.files) && order.files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-muted/50 rounded p-3">
                        <div className="flex items-center space-x-2 flex-1">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate">{file.name || `Archivo ${index + 1}`}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-2">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Imprimir Orden
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}