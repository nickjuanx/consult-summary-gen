
import { useState } from "react";
import { ConsultationRecord } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getConsultationsByPatient } from "@/lib/storage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Calendar, FileText, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PatientConsultationsProps {
  patientId: string;
}

const PatientConsultations = ({ patientId }: PatientConsultationsProps) => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);

  const { 
    data: consultations = [], 
    isLoading, 
    error
  } = useQuery({
    queryKey: ['consultations', patientId],
    queryFn: () => getConsultationsByPatient(patientId),
    enabled: !!patientId,
  });

  if (isLoading) {
    return <div className="text-center py-4">Cargando historial de consultas...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error al cargar historial</div>;
  }

  if (consultations.length === 0) {
    return <div className="text-center py-4 text-gray-500">No hay consultas registradas para este paciente.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Historial de Consultas</h3>
      <Accordion type="single" collapsible className="w-full">
        {consultations.map((consultation) => (
          <AccordionItem key={consultation.id} value={consultation.id}>
            <AccordionTrigger className="hover:bg-gray-50 px-4 py-3 rounded-md">
              <div className="flex items-center gap-3 text-left">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="font-medium">
                    {format(new Date(consultation.dateTime), "PPP", { locale: es })}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {format(new Date(consultation.dateTime), "p", { locale: es })}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <div className="space-y-3">
                {consultation.summary ? (
                  <>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-gray-500" />
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Resumen:</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-3">
                          {consultation.summary}
                        </p>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setSelectedConsultation(consultation)}
                        >
                          Ver consulta completa
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Consulta del {format(new Date(consultation.dateTime), "PPP", { locale: es })}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(consultation.dateTime), "p", { locale: es })}</span>
                          </div>
                          
                          {consultation.audioUrl && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Audio de la consulta:</h4>
                              <audio controls className="w-full">
                                <source src={consultation.audioUrl} type="audio/webm" />
                                Su navegador no soporta el elemento de audio.
                              </audio>
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Resumen:</h4>
                            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                              {consultation.summary}
                            </div>
                          </div>
                          
                          {consultation.transcription && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Transcripción completa:</h4>
                              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line text-sm text-gray-700 max-h-[300px] overflow-y-auto">
                                {consultation.transcription}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No hay resumen disponible para esta consulta.</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default PatientConsultations;
