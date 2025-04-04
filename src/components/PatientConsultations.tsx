import { useState, useEffect } from "react";
import { ConsultationRecord } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getConsultationsByPatient } from "@/lib/storage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, FileText, Clock, ChevronDown, PencilLine, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { updateConsultation } from "@/lib/storage";
interface PatientConsultationsProps {
  patientId: string;
}
const PatientConsultations = ({
  patientId
}: PatientConsultationsProps) => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editedSummary, setEditedSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const {
    toast
  } = useToast();

  // Add some console logging to help debug
  console.log("PatientConsultations - Patient ID:", patientId);
  const {
    data: consultations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['consultations', patientId],
    queryFn: () => getConsultationsByPatient(patientId),
    enabled: !!patientId
  });

  // Force a refetch when component mounts to ensure fresh data
  useEffect(() => {
    if (patientId) {
      refetch();
    }
  }, [patientId, refetch]);

  // Log the consultations that were fetched
  useEffect(() => {
    console.log("Consultations fetched:", consultations);
  }, [consultations]);
  const handleEditSummary = (consultation: ConsultationRecord) => {
    setEditedSummary(consultation.summary || "");
    setEditMode(consultation.id);
    setSelectedConsultation(consultation);
    setShowEditDialog(true);
  };
  const handleSaveSummary = async (consultation: ConsultationRecord) => {
    if (!editedSummary.trim()) {
      toast({
        title: "Error",
        description: "El resumen no puede estar vacío",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      // Create updated consultation object
      const updatedConsultation: ConsultationRecord = {
        ...consultation,
        summary: editedSummary
      };

      // Save to database
      const error = await updateConsultation(updatedConsultation);
      if (error) {
        throw new Error(error);
      }

      // Update local state in the consultations array
      const updatedConsultations = consultations.map(c => c.id === consultation.id ? {
        ...c,
        summary: editedSummary
      } : c);

      // Force a refetch to update the UI
      refetch();
      setEditMode(null);
      setShowEditDialog(false);
      toast({
        title: "Resumen actualizado",
        description: "El resumen ha sido actualizado correctamente"
      });
    } catch (error) {
      console.error("Error al guardar el resumen:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo actualizar el resumen",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancelEdit = () => {
    setEditMode(null);
    setShowEditDialog(false);
  };
  if (isLoading) {
    return <div className="text-center py-4">Cargando historial de consultas...</div>;
  }
  if (error) {
    console.error("Error fetching consultations:", error);
    return <div className="text-center py-4 text-red-500">Error al cargar historial: {String(error)}</div>;
  }
  if (consultations.length === 0) {
    return <div className="text-center py-4 text-gray-500">No hay consultas registradas para este paciente.</div>;
  }
  return <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-50">Historial de Consultas</h3>
      <Accordion type="single" collapsible className="w-full">
        {consultations.map(consultation => <AccordionItem key={consultation.id} value={consultation.id}>
            <AccordionTrigger className="px-4 py-3 rounded-md bg-cyan-900 hover:bg-cyan-800">
              <div className="flex items-center gap-3 text-left">
                <Calendar className="h-4 w-4 text-gray-500 rounded bg-gray-50" />
                <div>
                  <span className="font-medium text-slate-50">
                    {format(new Date(consultation.dateTime), "PPP", {
                  locale: es
                })}
                  </span>
                  <span className="text-sm ml-2 text-slate-50">
                    {format(new Date(consultation.dateTime), "p", {
                  locale: es
                })}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <div className="space-y-3">
                {consultation.summary ? <>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-gray-500 bg-slate-50" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium mb-1 text-slate-50">Resumen:</h4>
                          {editMode !== consultation.id && <Button variant="ghost" size="sm" onClick={() => handleEditSummary(consultation)} className="h-7 px-2 text-gray-50 bg-transparent">
                              <PencilLine className="h-3.5 w-3.5" />
                              <span className="ml-1 text-xs text-slate-50">Editar</span>
                            </Button>}
                        </div>
                        
                        <p className="text-sm whitespace-pre-line line-clamp-3 text-slate-50">
                          {consultation.summary}
                        </p>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setSelectedConsultation(consultation)}>
                          Ver consulta completa
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Consulta del {format(new Date(consultation.dateTime), "PPP", {
                        locale: es
                      })}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(consultation.dateTime), "p", {
                          locale: es
                        })}</span>
                          </div>
                          
                          {consultation.audioUrl && <div className="mt-4">
                              <h4 className="font-medium mb-2">Audio de la consulta:</h4>
                              <audio controls className="w-full">
                                <source src={consultation.audioUrl} type="audio/webm" />
                                Su navegador no soporta el elemento de audio.
                              </audio>
                            </div>}
                          
                          <div className="mt-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium mb-2">Resumen:</h4>
                              <Button variant="outline" size="sm" onClick={() => handleEditSummary(consultation)}>
                                <PencilLine className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                              {consultation.summary}
                            </div>
                          </div>
                          
                          {consultation.transcription && <div className="mt-4">
                              <h4 className="font-medium mb-2">Transcripción completa:</h4>
                              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line text-sm text-gray-700 max-h-[300px] overflow-y-auto">
                                {consultation.transcription}
                              </div>
                            </div>}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </> : <p className="text-sm text-gray-500">No hay resumen disponible para esta consulta.</p>}
              </div>
            </AccordionContent>
          </AccordionItem>)}
      </Accordion>

      {/* Large edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent fullWidth className="overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Resumen - {selectedConsultation && format(new Date(selectedConsultation.dateTime), "PPP", {
              locale: es
            })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {selectedConsultation?.audioUrl && <div>
                <h4 className="font-medium mb-2">Audio de la consulta:</h4>
                <audio controls className="w-full">
                  <source src={selectedConsultation.audioUrl} type="audio/webm" />
                  Su navegador no soporta el elemento de audio.
                </audio>
              </div>}
            
            <div>
              <h4 className="font-medium mb-2">Resumen:</h4>
              <Textarea value={editedSummary} onChange={e => setEditedSummary(e.target.value)} className="min-h-[300px] text-sm font-mono" placeholder="Edite el resumen aquí..." />
            </div>
            
            {selectedConsultation?.transcription && <div>
                <h4 className="font-medium mb-2">Transcripción completa:</h4>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line text-sm text-gray-700 max-h-[400px] overflow-y-auto border">
                  {selectedConsultation.transcription}
                </div>
              </div>}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving} className="h-10">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="default" onClick={() => selectedConsultation && handleSaveSummary(selectedConsultation)} disabled={isSaving} className="h-10">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default PatientConsultations;