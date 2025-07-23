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
  CheckCircle,
  Package,
  DollarSign
} from "lucide-react";

interface Order {
  id: string;
  folio: string;
  client: string;
  work_type: string;
  status: string;
  priority: string;
  production_status: string;
  description?: string;
  notes?: string;
  files?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  total_amount?: number;
  advance_payment?: number;
  remaining_balance?: number;
  delivery_status: string;
  completed_at?: string;
  completed_by?: string;
}

interface ProductionOrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleteOrder: () => void;
}

export default function ProductionOrderDialog({ 
  order, 
  open, 
  onOpenChange, 
  onCompleteOrder 
}: ProductionOrderDialogProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado": return "default";
      case "En Proceso": return "secondary"; 
      case "Pendiente": return "outline";
      case "Listo para Entrega": return "default";
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

  const getProductionStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'secondary';
      case 'En Proceso': return 'default';
      case 'Completado': return 'default';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada";
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalFiles = () => {
    if (!order.files) return 0;
    try {
      const filesArray = Array.isArray(order.files) ? order.files : JSON.parse(order.files);
      return filesArray.length;
    } catch {
      return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6" />
            Orden de Producción - Folio: {order.folio}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Estado y Prioridad */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusColor(order.status)} className="text-sm">
              Estado: {order.status}
            </Badge>
            <Badge variant={getPriorityColor(order.priority)} className="text-sm">
              Prioridad: {order.priority}
            </Badge>
            <Badge variant={getProductionStatusColor(order.production_status)} className="text-sm">
              Producción: {order.production_status}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Entrega: {order.delivery_status}
            </Badge>
          </div>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Cliente</p>
                  <p className="text-base">{order.client}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Tipo de Trabajo</p>
                  <p className="text-base">{order.work_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Trabajo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Detalles del Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.description && (
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Descripción</p>
                  <p className="text-base leading-relaxed">{order.description}</p>
                </div>
              )}
              
              {order.notes && (
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Notas Adicionales</p>
                  <p className="text-base leading-relaxed">{order.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Fecha de Creación</p>
                  <p className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.created_at)}
                  </p>
                </div>
                
                {order.due_date && (
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Fecha de Entrega</p>
                    <p className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatDate(order.due_date)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          {(order.total_amount || order.advance_payment) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Información de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {order.total_amount && (
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">${order.total_amount}</p>
                    </div>
                  )}
                  {order.advance_payment && (
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Anticipo</p>
                      <p className="text-lg font-semibold text-green-600">${order.advance_payment}</p>
                    </div>
                  )}
                  {order.remaining_balance && (
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Saldo Pendiente</p>
                      <p className="text-lg font-semibold text-orange-600">${order.remaining_balance}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Archivos Adjuntos */}
          {getTotalFiles() > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Folder className="h-5 w-5" />
                  Archivos Adjuntos ({getTotalFiles()})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Se encontraron {getTotalFiles()} archivo(s) adjunto(s) para este trabajo
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado de Finalización */}
          {order.completed_at && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Trabajo completado el {formatDate(order.completed_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botón de Acción */}
          {order.production_status === 'Pendiente' && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={onCompleteOrder}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Marcar como Completado
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}