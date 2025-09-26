import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { FileText, Download, Eye, Loader2 } from 'lucide-react'

interface DocumentTemplate {
  id: string
  title: string
  description: string | null
  subscription_level: string
  placeholders: any // Use any to handle Json type from Supabase
  is_active: boolean
  created_at: string
}

interface VesselDocumentGeneratorProps {
  vessel: any // Use any to handle the complex vessel type from Supabase
}

export function VesselDocumentGenerator({ vessel }: VesselDocumentGeneratorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const processedTemplates = (data || []).map(template => ({
        ...template,
        placeholders: Array.isArray(template.placeholders) 
          ? template.placeholders 
          : (template.placeholders ? JSON.parse(template.placeholders as string) : [])
      }))
      
      setTemplates(processedTemplates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to fetch document templates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateDocument = async (templateId: string, format: 'docx' | 'pdf' | 'both') => {
    if (!vessel) return
    
    setGenerating(prev => ({ ...prev, [templateId]: true }))
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-document-processor', {
        body: {
          templateId: templateId,
          vesselId: vessel.id,
          portId: vessel.current_port_id || undefined,
          companyId: vessel.owner_company_id || undefined,
          refineryId: vessel.destination_refinery_id || undefined,
          format: format
        }
      })

      if (error) throw error

      if (data?.success) {
        // Download Word document
        if (data.docx_url && (format === 'docx' || format === 'both')) {
          const link = document.createElement('a')
          link.href = data.docx_url
          link.download = `${vessel.name}-document.docx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        
        // Download PDF
        if (data.pdf_url && (format === 'pdf' || format === 'both')) {
          const link = document.createElement('a')
          link.href = data.pdf_url
          link.download = `${vessel.name}-document.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        
        toast({
          title: "Document Generated",
          description: `Document generated successfully with ${data.stats?.placeholders_filled || 0} data fields filled.`
        })
      }
    } catch (error) {
      console.error('Error generating document:', error)
      toast({
        title: "Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setGenerating(prev => ({ ...prev, [templateId]: false }))
    }
  }

  const getSubscriptionColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-blue-500'
      case 'professional': return 'bg-purple-500'
      case 'enterprise': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Documents for {vessel.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate professional documents with vessel-specific data automatically filled in
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No document templates available</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{template.title}</h3>
                    <Badge 
                      variant="secondary" 
                      className={`text-white ${getSubscriptionColor(template.subscription_level)}`}
                    >
                      {template.subscription_level}
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {Array.isArray(template.placeholders) ? template.placeholders.length : 0} data fields available
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedTemplate(
                      expandedTemplate === template.id ? null : template.id
                    )}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>

              {expandedTemplate === template.id && (
                <>
                  <Separator className="mb-3" />
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Available Data Fields:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(template.placeholders) ? template.placeholders : []).map((placeholder: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {placeholder.replace(/[{}[\]]/g, '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator className="mb-3" />
                </>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => generateDocument(template.id, 'docx')}
                  disabled={generating[template.id]}
                  size="sm"
                >
                  {generating[template.id] ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1" />
                  )}
                  Word Document
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateDocument(template.id, 'pdf')}
                  disabled={generating[template.id]}
                  size="sm"
                >
                  {generating[template.id] ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => generateDocument(template.id, 'both')}
                  disabled={generating[template.id]}
                  size="sm"
                >
                  {generating[template.id] ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1" />
                  )}
                  Both Formats
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}