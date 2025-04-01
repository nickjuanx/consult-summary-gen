
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConsultationRecord } from "@/types";
import { getConsultations, deleteConsultation } from "@/lib/storage";
import { format } from "date-fns";
import { FileAudio, ArrowRight, Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface ConsultationsListProps {
  onConsultationSelect: (consultation: ConsultationRecord) => void;
}

const ConsultationsList = ({ onConsultationSelect }: ConsultationsListProps) => {
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setConsultations(getConsultations());
  }, []);

  const handleDelete = (id: string) => {
    deleteConsultation(id);
    setConsultations(getConsultations());
    setDeleteId(null);
    
    toast({
      title: "Consulta Eliminada",
      description: "La consulta ha sido eliminada correctamente",
    });
  };

  if (consultations.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <FileAudio className="h-12 w-12 text-medical-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay consultas aún</h3>
            <p className="text-gray-500">
              Graba tu primera consulta médica para comenzar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-medical-900">Consultas Recientes</h2>
      
      {consultations.map((consultation) => (
        <Card key={consultation.id} className="overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-medium text-medical-800">
                  {consultation.patientName}
                </CardTitle>
                <CardDescription>
                  {format(new Date(consultation.dateTime), 'PPP')} a las {format(new Date(consultation.dateTime), 'p')}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(consultation.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {consultation.summary && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {consultation.summary.substring(0, 120)}...
              </p>
            )}
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-medical-600 hover:text-medical-800"
              onClick={() => onConsultationSelect(consultation)}
            >
              Ver detalles <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      ))}
      
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente el registro de la consulta y no se podrá deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConsultationsList;
