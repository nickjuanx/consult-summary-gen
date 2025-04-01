
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { groqApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveConsultation } from "@/lib/storage";
import { ConsultationRecord } from "@/types";
import PatientSelector from "./PatientSelector";
import { Patient } from "@/types";

interface AudioRecorderProps {
  onRecordingComplete: (consultation: ConsultationRecord) => void;
}

const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [patientName, setPatientName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Cuando se selecciona un paciente, actualizamos el nombre
  useEffect(() => {
    if (selectedPatient) {
      setPatientName(selectedPatient.name);
    }
  }, [selectedPatient]);

  const startRecording = async () => {
    if (!patientName.trim()) {
      toast({
        title: "Nombre del paciente requerido",
        description: "Por favor ingrese el nombre del paciente antes de grabar",
        variant: "destructive",
      });
      return;
    }

    if (!groqApi.hasApiKey()) {
      toast({
        title: "API Key Requerida",
        description: "Por favor configure la API key de Groq primero",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
        
        await processRecording(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Grabación Iniciada",
        description: "La consulta está siendo grabada",
      });
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      toast({
        title: "Error de Micrófono",
        description: "No se pudo acceder al micrófono. Por favor verifique los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast({
        title: "Grabación Detenida",
        description: "Procesando su consulta...",
      });
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const transcriptionResponse = await groqApi.transcribeAudio(audioBlob);
      
      if (!transcriptionResponse.success) {
        throw new Error(transcriptionResponse.error || "La transcripción falló");
      }
      
      const transcription = transcriptionResponse.data.text;
      
      const summaryResponse = await groqApi.generateSummary(transcription);
      
      if (!summaryResponse.success) {
        throw new Error(summaryResponse.error || "La generación del resumen falló");
      }
      
      const summary = summaryResponse.data.choices[0].message.content;
      
      const patientData = groqApi.extractPatientData(summary);
      
      const newConsultation: ConsultationRecord = {
        id: Date.now().toString(),
        patientName: patientName.trim(),
        dateTime: new Date().toISOString(),
        audioUrl: audioUrl || undefined,
        transcription,
        summary,
        patientData,
        patientId: selectedPatient?.id
      };
      
      await saveConsultation(newConsultation);
      
      onRecordingComplete(newConsultation);
      
      toast({
        title: "Consulta Procesada",
        description: "La transcripción y el resumen están listos",
      });
      
      setPatientName("");
      setAudioUrl(null);
      setSelectedPatient(null);
    } catch (error) {
      console.error("Error de procesamiento:", error);
      toast({
        title: "Error de Procesamiento",
        description: error instanceof Error ? error.message : "No se pudo procesar la grabación",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Nombre del Paciente</Label>
            <div className="flex items-center space-x-2">
              <Input 
                id="patientName"
                placeholder="Ingrese el nombre del paciente"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={isRecording || isProcessing}
                className="w-full"
              />
              <Button 
                variant="outline" 
                onClick={() => setShowPatientSelector(!showPatientSelector)}
                disabled={isRecording || isProcessing}
              >
                {selectedPatient ? "Cambiar" : "Buscar"}
              </Button>
            </div>
          </div>
          
          {showPatientSelector && (
            <div className="mt-2 border rounded-md p-4 bg-gray-50">
              <PatientSelector 
                onPatientSelect={handlePatientSelect}
                selectedPatientId={selectedPatient?.id}
                initialPatientName={patientName}
              />
            </div>
          )}
          
          {(isRecording || isProcessing) && (
            <div className="mt-4">
              {isRecording ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse-recording"></div>
                  <span className="text-red-600 font-medium">Grabando: {formatTime(recordingTime)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-medical-600" />
                  <span className="text-medical-600 font-medium">Procesando consulta...</span>
                </div>
              )}
              <div className="waveform mt-2"></div>
            </div>
          )}
          
          <div className="flex justify-center pt-4">
            {isRecording ? (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Square className="mr-2 h-4 w-4" />
                Detener Grabación
              </Button>
            ) : (
              <Button 
                onClick={startRecording} 
                variant="default"
                size="lg"
                disabled={isProcessing || !patientName.trim()}
                className="w-full sm:w-auto bg-medical-600 hover:bg-medical-700"
              >
                <Mic className="mr-2 h-4 w-4" />
                Iniciar Grabación
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
