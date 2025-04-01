
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { groqApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addConsultation } from "@/lib/storage";
import { ConsultationRecord } from "@/types";

interface AudioRecorderProps {
  onRecordingComplete: (consultation: ConsultationRecord) => void;
}

const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [patientName, setPatientName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (!patientName.trim()) {
      toast({
        title: "Patient Name Required",
        description: "Please enter the patient's name before recording",
        variant: "destructive",
      });
      return;
    }

    if (!groqApi.hasApiKey()) {
      toast({
        title: "API Key Required",
        description: "Please configure the Groq API key first",
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
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        await processRecording(audioBlob);
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "The consultation is now being recorded",
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access the microphone. Please check permissions.",
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
        title: "Recording Stopped",
        description: "Processing your consultation...",
      });
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Transcribe the audio
      const transcriptionResponse = await groqApi.transcribeAudio(audioBlob);
      
      if (!transcriptionResponse.success) {
        throw new Error(transcriptionResponse.error || "Transcription failed");
      }
      
      const transcription = transcriptionResponse.data.text;
      
      // Step 2: Generate summary from transcription
      const summaryResponse = await groqApi.generateSummary(transcription);
      
      if (!summaryResponse.success) {
        throw new Error(summaryResponse.error || "Summary generation failed");
      }
      
      const summary = summaryResponse.data.choices[0].message.content;
      
      // Create new consultation record
      const newConsultation: ConsultationRecord = {
        id: Date.now().toString(),
        patientName: patientName.trim(),
        dateTime: new Date().toISOString(),
        audioUrl: audioUrl || undefined,
        transcription,
        summary
      };
      
      // Add to storage
      addConsultation(newConsultation);
      
      // Pass to parent component
      onRecordingComplete(newConsultation);
      
      toast({
        title: "Consultation Processed",
        description: "Transcription and summary are ready",
      });
      
      // Reset form
      setPatientName("");
      setAudioUrl(null);
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process the recording",
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

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name</Label>
            <Input 
              id="patientName"
              placeholder="Enter patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              disabled={isRecording || isProcessing}
              className="w-full"
            />
          </div>
          
          {(isRecording || isProcessing) && (
            <div className="mt-4">
              {isRecording ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse-recording"></div>
                  <span className="text-red-600 font-medium">Recording: {formatTime(recordingTime)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-medical-600" />
                  <span className="text-medical-600 font-medium">Processing consultation...</span>
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
                Stop Recording
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
                Start Recording
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
