import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Loader2, CheckCircle2, XCircle, LayoutDashboard, Upload, Eye, ArrowLeft, Settings, Moon, Sun, Sparkles, Users as UsersIcon } from "lucide-react";
import { EMAIL_TEMPLATES, EMAIL_CATEGORIES } from "./email-templates";
import TemplateVariableInput from "./TemplateVariableInput";
import EmojiPicker from "./EmojiPicker";
import SignatureBuilder from "./SignatureBuilder";
import AISubjectGenerator from "./AISubjectGenerator";
import TestEmailSender from "./TestEmailSender";
import EmailAnalytics from "./EmailAnalytics";
import PersonalizationTokens from "./PersonalizationTokens";

interface EmailStatus {
  email: string;
  status: "pending" | "success" | "error";
  message?: string;
}

const BulkMailSender = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("465");
  const [useSSL, setUseSSL] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("welcome");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [emailStatuses, setEmailStatuses] = useState<EmailStatus[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkPreview, setDarkPreview] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user?.email) {
      const savedCredentials = localStorage.getItem(`smtp_credentials_${user.email}`);
      if (savedCredentials) {
        const { smtpEmail, appPassword, smtpHost, smtpPort, useSSL } = JSON.parse(savedCredentials);
        setEmail(smtpEmail || "");
        setAppPassword(appPassword || "");
        setSmtpHost(smtpHost || "smtp.gmail.com");
        setSmtpPort(smtpPort || "465");
        setUseSSL(useSSL !== undefined ? useSSL : true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      const savedTemplate = localStorage.getItem(`selectedTemplate_${user.email}`);
      if (savedTemplate) {
        const template = JSON.parse(savedTemplate);
        setSubject(template.subject);
        setBody(template.body);
        localStorage.removeItem(`selectedTemplate_${user.email}`);
      }
    }
  }, [user]);

  const currentTemplate = useMemo(() => {
    return EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);
  }, [selectedTemplate]);

  const filteredTemplates = useMemo(() => {
    return EMAIL_TEMPLATES.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setTemplateVariables({});
    }
  };

  const replaceVariables = (text: string, variables: Record<string, string>): string => {
    let result = text;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, variables[key] || `{{${key}}}`);
    });
    return result;
  };

  const parseRecipients = (text: string): string[] => {
    return text
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter((email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const emails: string[] = [];

      lines.forEach(line => {
        const parts = line.split(',');
        parts.forEach(part => {
          const email = part.trim();
          if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emails.push(email);
          }
        });
      });

      if (emails.length > 0) {
        setRecipients(prev => {
          const current = parseRecipients(prev);
          const combined = [...new Set([...current, ...emails])];
          return combined.join('\n');
        });
        toast({ title: "Success", description: `Added ${emails.length} email addresses from CSV` });
      } else {
        toast({ title: "Error", description: "No valid emails found", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveCredentials = () => {
    if (!email.trim() || !appPassword.trim() || !smtpHost.trim() || !smtpPort.trim()) {
      toast({ title: "Error", description: "Complete all SMTP fields", variant: "destructive" });
      return;
    }
    if (user?.email) {
      localStorage.setItem(`smtp_credentials_${user.email}`, JSON.stringify({
        smtpEmail: email,
        appPassword,
        smtpHost,
        smtpPort,
        useSSL
      }));
    }
    toast({ title: "Success", description: "SMTP configuration updated" });
    setSettingsOpen(false);
  };

  const handleSend = async () => {
    const finalSubject = replaceVariables(subject, templateVariables);
    const finalBody = replaceVariables(body, templateVariables);

    if (!finalSubject.trim() || !finalBody.trim()) {
      toast({ title: "Error", description: "Subject and body required", variant: "destructive" });
      return;
    }

    if (!senderName.trim() || !senderEmail.trim() || !email.trim() || !appPassword.trim()) {
      toast({ title: "Error", description: "Sender info or SMTP not configured", variant: "destructive" });
      return;
    }

    const recipientList = parseRecipients(recipients);
    if (recipientList.length === 0) {
      toast({ title: "Error", description: "No recipients", variant: "destructive" });
      return;
    }

    setIsSending(true);
    setEmailStatuses(recipientList.map((email) => ({ email, status: "pending" })));

    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: {
          smtpEmail: email,
          appPassword,
          smtpHost,
          smtpPort: parseInt(smtpPort),
          useSSL,
          senderName,
          senderEmail,
          recipients: recipientList,
          subject: finalSubject,
          body: finalBody,
        },
      });

      if (error) throw error;
      const results = data.results || [];
      setEmailStatuses(results);

      const successCount = results.filter((r: any) => r.status === "success").length;

      const emailData = {
        id: Date.now().toString(),
        subject: finalSubject,
        recipients: recipientList,
        sender_name: senderName,
        sender_email: senderEmail,
        scheduled_at: new Date().toISOString(),
        status: successCount > 0 ? "sent" : "failed",
      };
      if (user?.email) {
        const stored = localStorage.getItem(`sent_emails_${user.email}`);
        const emails = stored ? JSON.parse(stored) : [];
        emails.unshift(emailData);
        localStorage.setItem(`sent_emails_${user.email}`, JSON.stringify(emails));
      }

      if (successCount > 0) {
        toast({ title: "Success", description: `Successfully dispatched to ${successCount} targets.` });
      } else {
        const firstError = results.find((r: any) => r.status === "error")?.message;
        toast({
          title: "Dispatch Failed",
          description: firstError || "Connection failed. Please check your SMTP settings and app password.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "System Error",
        description: error.message || "Failed to communicate with delivery engine.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Campaign</h1>
          <p className="text-gray-500 font-medium">Design and dispatch your high-impact email blasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSettingsOpen(true)} className="rounded-xl border-gray-200 font-bold h-11 px-5 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all">
            <Settings className="w-4 h-4 mr-2" /> SMTP Config
          </Button>
          <Button variant={showAnalytics ? "default" : "outline"} onClick={() => setShowAnalytics(!showAnalytics)} className={`rounded-xl h-11 px-5 font-bold transition-all ${showAnalytics ? 'bg-blue-600' : 'border-gray-200'}`}>
            {showAnalytics ? 'Hide Stats' : 'Show Stats'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Message Editor</CardTitle>
                  <CardDescription className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">HTML Content Supported</CardDescription>
                </div>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Sender Name</Label>
                  <Input placeholder="John Doe" value={senderName} onChange={e => setSenderName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Sender Email</Label>
                  <Input placeholder="john@company.com" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Subject Line</Label>
                  <div className="flex items-center gap-1 scale-90 origin-right">
                    <AISubjectGenerator onSelect={setSubject} emailBody={body} />
                    <EmojiPicker onSelect={emoji => setSubject(p => p + emoji)} />
                  </div>
                </div>
                <Input placeholder="Ready to scale your business?" value={subject} onChange={e => setSubject(e.target.value)} className="h-14 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold text-lg" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Email Body (HTML)</Label>
                  <div className="flex items-center gap-1 scale-90 origin-right">
                    <PersonalizationTokens onInsert={token => setBody(p => p + token)} />
                    <EmojiPicker onSelect={emoji => setBody(p => p + emoji)} />
                    <SignatureBuilder onInsert={sig => setBody(p => p + "\n\n" + sig)} />
                  </div>
                </div>
                <Textarea value={body} onChange={e => setBody(e.target.value)} rows={12} className="rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-mono text-sm p-6 leading-relaxed mb-10" />
                <div className="flex gap-4">
                  <Button onClick={() => setPreviewOpen(true)} variant="outline" className="flex-1 h-14 rounded-2xl border-2 font-bold hover:bg-gray-50 transition-all">
                    <Eye className="w-5 h-5 mr-2" /> Quick Preview
                  </Button>
                  <Button onClick={handleSend} disabled={isSending} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]">
                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5 mr-2" /> Launch Campaign</>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Recipient List</CardTitle>
              <CardDescription className="text-xs font-medium">Add emails manually or import CSV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea placeholder="email1@example.com, email2@example.com..." value={recipients} onChange={e => setRecipients(e.target.value)} rows={6} className="rounded-2xl bg-gray-50 border-gray-100 focus:bg-white text-sm" />
                <div className="absolute bottom-3 right-3">
                  <input type="file" ref={fileInputRef} onChange={handleCSVUpload} accept=".csv" className="hidden" />
                  <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="rounded-lg h-8 text-[10px] font-bold bg-white border border-gray-100 shadow-sm">
                    <Upload className="w-3 h-3 mr-1" /> Import CSV
                  </Button>
                </div>
              </div>
              {parseRecipients(recipients).length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <UsersIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">{parseRecipients(recipients).length} Valid Recipients</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Template Hub</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-gray-100">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMAIL_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-gray-100">
                  <SelectValue placeholder="Select Layout" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="pt-2">
                <Button variant="ghost" className="w-full text-blue-600 font-bold text-xs gap-2" onClick={() => navigate("/templates")}>
                  <Sparkles className="w-3 h-3" /> Browse Design Library
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 bg-black rounded-[2rem] text-white space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" /> Professional Tip
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Personalized subject lines increase open rates by 26%. Use our AI generator to optimize your impact.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-gray-50 border-b border-gray-100 flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl font-bold">Campaign Preview</DialogTitle>
              <DialogDescription className="font-medium text-gray-500">Subject: {subject}</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDarkPreview(!darkPreview)} className="rounded-xl">
              {darkPreview ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </DialogHeader>
          <div className="p-8">
            <div className={`p-8 rounded-2xl border border-gray-100 overflow-y-auto max-h-[500px] shadow-inner transition-colors ${darkPreview ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-gray-900 border-gray-100'}`} dangerouslySetInnerHTML={{ __html: replaceVariables(body, templateVariables) }} />
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button onClick={() => setPreviewOpen(false)} className="rounded-xl px-10 font-bold h-12 bg-gray-900 text-white">Looks Good</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMTP Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold">SMTP Configuration</DialogTitle>
            <DialogDescription className="text-gray-500">Set up your delivery engine credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">SMTP Host</Label>
                <Input placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-gray-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Port</Label>
                <Input placeholder="465" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-gray-100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">User Email</Label>
              <Input placeholder="your-email@gmail.com" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-gray-100" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">App Password</Label>
              <Input placeholder="xxxx xxxx xxxx xxxx" type="password" value={appPassword} onChange={e => setAppPassword(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-gray-100" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="useSSL" checked={useSSL} onChange={e => setUseSSL(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
              <Label htmlFor="useSSL" className="text-xs font-bold text-gray-600 cursor-pointer">Use SSL / TLS Security</Label>
            </div>
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 transition-all active:scale-[0.98]" onClick={handleSaveCredentials}>Save & Verify</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkMailSender;
