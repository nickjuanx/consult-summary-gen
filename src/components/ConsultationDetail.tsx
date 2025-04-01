
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultationRecord, Patient } from "@/types";
import { Download, Clipboard, CheckCircle2, User } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { getPatientById } from "@/lib/patients";

interface ConsultationDetailProps {
  consultation: ConsultationRecord;
  onBack: () => void;
}

const ConsultationDetail = ({ consultation, onBack }: ConsultationDetailProps) => {
  const [copied, setCopied] = useState<'transcription' | 'summary' | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Cargar datos completos del paciente si hay un ID
    const loadPatient = async () => {
      if (consultation.patientId) {
        const patientData = await getPatientById(consultation.patientId);
        if (patientData) {
          setPatient(patientData);
        }
      }
    };
    
    loadPatient();
  }, [consultation.patientId]);
  
  const copyToClipboard = async (text: string, type: 'transcription' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      
      toast({
        title: "Copiado al portapapeles",
        description: `El ${type === 'transcription' ? 'transcripción' : 'resumen'} ha sido copiado al portapapeles`,
      });
      
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Error al copiar:", error);
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };
  
  const downloadAudio = () => {
    if (consultation.audioUrl) {
      const a = document.createElement('a');
      a.href = consultation.audioUrl;
      a.download = `consulta_${consultation.patientName.replace(/\s+/g, '_')}_${format(new Date(consultation.dateTime), 'yyyy-MM-dd')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  // Usamos los datos del paciente de la consulta o los datos completos del paciente
  const patientData = patient || {
    id: consultation.patientId || '',
    name: consultation.patientName,
    dni: consultation.patientData?.dni,
    phone: consultation.patientData?.phone,
    age: consultation.patientData?.age,
    email: consultation.patientData?.email
  };
  
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        ← Volver a todas las consultas
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-medical-800">Paciente: {consultation.patientName}</CardTitle>
          <CardDescription>
            Consulta el {format(new Date(consultation.dateTime), 'PPP', { locale: es })} a las {format(new Date(consultation.dateTime), 'p')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4" />
              <span className="font-medium">Datos Personales:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {patientData.dni && (
                <div>
                  <span className="font-medium">DNI:</span> {patientData.dni}
                </div>
              )}
              {patientData.phone && (
                <div>
                  <span className="font-medium">Teléfono:</span> {patientData.phone}
                </div>
              )}
              {patientData.age && (
                <div>
                  <span className="font-medium">Edad:</span> {patientData.age}
                </div>
              )}
              {patientData.email && (
                <div>
                  <span className="font-medium">Email:</span> {patientData.email}
                </div>
              )}
              {patient?.notes && (
                <div className="col-span-2">
                  <span className="font-medium">Notas:</span> {patient.notes}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {consultation.audioUrl && (
          <CardContent>
            <div className="my-2">
              <audio controls className="w-full">
                <source src={consultation.audioUrl} type="audio/webm" />
                Su navegador no soporta el elemento de audio.
              </audio>
            </div>
            <Button variant="outline" onClick={downloadAudio} className="mt-2">
              <Download className="mr-2 h-4 w-4" />
              Descargar Audio
            </Button>
          </CardContent>
        )}
      </Card>
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="transcription">Transcripción Completa</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-medical-800 flex justify-between items-center">
                <span>Resumen de la Consulta</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => consultation.summary && copyToClipboard(consultation.summary, 'summary')}
                >
                  {copied === 'summary' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{consultation.summary || "No hay resumen disponible"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transcription">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-medical-800 flex justify-between items-center">
                <span>Transcripción Completa</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => consultation.transcription && copyToClipboard(consultation.transcription, 'transcription')}
                >
                  {copied === 'transcription' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{consultation.transcription || "No hay transcripción disponible"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationDetail;
