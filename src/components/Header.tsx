
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, MicOff } from "lucide-react";
import ApiKeyDialog from "./ApiKeyDialog";
import { groqApi } from "@/lib/api";

const Header = () => {
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Check if API key is already stored
    const storedApiKey = localStorage.getItem("groqApiKey");
    if (storedApiKey) {
      groqApi.setApiKey(storedApiKey);
      setHasApiKey(true);
    } else {
      // If no key is found, prompt the user
      setApiDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    setHasApiKey(groqApi.hasApiKey());
  }, [apiDialogOpen]);

  return (
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <MicOff className="h-6 w-6 text-medical-600" />
          <h1 className="text-xl font-medium tracking-tight text-medical-900">ConsultSummary</h1>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setApiDialogOpen(true)}
          className={hasApiKey ? "bg-green-50 text-green-700 hover:text-green-800 hover:bg-green-100" : "bg-amber-50 text-amber-700 hover:text-amber-800 hover:bg-amber-100"}
        >
          <Settings className="mr-2 h-4 w-4" />
          {hasApiKey ? "API Configured" : "Set API Key"}
        </Button>
        
        <ApiKeyDialog open={apiDialogOpen} onOpenChange={setApiDialogOpen} />
      </div>
    </header>
  );
};

export default Header;
