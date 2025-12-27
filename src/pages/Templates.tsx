import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Mail, Building2, ShoppingBag, Code, Stethoscope, GraduationCap, Home, Utensils, Plane, Landmark, Sparkles } from "lucide-react";
import { WEBSITE_TEMPLATE_CATEGORIES, WEBSITE_TEMPLATES_DATA } from "@/components/website-templates-data";
import AITemplateGenerator from "@/components/AITemplateGenerator";

const Templates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const categoryIcons: Record<string, any> = {
    "Business & Corporate": <Building2 className="w-4 h-4" />,
    "E-Commerce & Retail": <ShoppingBag className="w-4 h-4" />,
    "Technology & SaaS": <Code className="w-4 h-4" />,
    "Healthcare & Wellness": <Stethoscope className="w-4 h-4" />,
    "Education & Training": <GraduationCap className="w-4 h-4" />,
    "Real Estate & Property": <Home className="w-4 h-4" />,
    "Food & Restaurant": <Utensils className="w-4 h-4" />,
    "Travel & Hospitality": <Plane className="w-4 h-4" />,
    "Finance & Banking": <Landmark className="w-4 h-4" />,
    "Fashion & Beauty": <Sparkles className="w-4 h-4" />
  };

  const filteredTemplates = WEBSITE_TEMPLATES_DATA.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: any) => {
    if (user?.email) {
      localStorage.setItem(`selectedTemplate_${user.email}`, JSON.stringify(template));
    }
    navigate("/compose");
  };

  const handleAITemplate = (template: { subject: string; body: string }) => {
    if (user?.email) {
      localStorage.setItem(`selectedTemplate_${user.email}`, JSON.stringify({
        id: "ai_generated",
        name: "AI Generated Template",
        category: "Custom",
        subject: template.subject,
        body: template.body,
        variables: []
      }));
    }
    navigate("/compose");
  };

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900Sm sm:text-4xl">Layout Library</h1>
          <p className="mt-2 text-lg text-gray-500">Pick a professional starting point for your next masterpiece.</p>
        </div>
        <AITemplateGenerator onTemplateGenerated={handleAITemplate} />
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search layouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={`h-10 rounded-xl px-5 font-bold text-xs transition-all ${selectedCategory === 'all' ? 'bg-blue-600 border-blue-600' : 'border-gray-100'}`}
          >
            Universal
          </Button>
          {WEBSITE_TEMPLATE_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`h-10 rounded-xl px-5 font-bold text-xs gap-2 transition-all ${selectedCategory === category ? 'bg-blue-600 border-blue-600' : 'border-gray-100'}`}
            >
              {categoryIcons[category]}
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 hover:border-blue-100 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
            onClick={() => {
              setSelectedTemplate(template);
              setPreviewOpen(true);
            }}
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={template.previewImage}
                alt={template.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <Button className="w-full bg-white text-gray-900 hover:bg-white/90 font-bold rounded-xl h-11">View Large Preview</Button>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{template.category}</span>
                <div className="text-gray-300">{categoryIcons[template.category]}</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{template.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-6 font-medium leading-relaxed">{template.description}</p>
              <div className="mt-auto">
                <Button
                  onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}
                  className="w-full bg-gray-50 text-gray-900 hover:bg-blue-600 hover:text-white transition-all font-bold rounded-xl h-12"
                >
                  Select Layout
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-xl font-bold text-gray-900">No matches found</h3>
          <p className="text-gray-500">Try searching for something else or browse all categories.</p>
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-[2.5rem] border-none shadow-2xl flex flex-col">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">{selectedTemplate?.name}</DialogTitle>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{selectedTemplate?.category}</p>
            </div>
            <Button onClick={() => handleUseTemplate(selectedTemplate)} className="bg-blue-600 text-white rounded-xl px-8 font-bold h-12 shadow-lg shadow-blue-100">Use Template</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <Tabs defaultValue="preview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-12">
                <TabsTrigger value="preview" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Visual Preview</TabsTrigger>
                <TabsTrigger value="details" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">System Specs</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-white">
                <div className="p-1 max-h-[500px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: selectedTemplate?.body }} />
              </TabsContent>
              <TabsContent value="details" className="space-y-6 pb-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Recommended Subject</h4>
                  <p className="font-bold text-gray-900">{selectedTemplate?.subject}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Design Notes</h4>
                  <p className="text-gray-600 font-medium leading-relaxed">{selectedTemplate?.description}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;