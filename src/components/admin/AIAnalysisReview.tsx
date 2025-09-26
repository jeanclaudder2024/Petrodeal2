import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Brain,
  RefreshCw,
  Check,
  X,
  Edit3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface AIAnalysisReviewProps {
  template: {
    id: string
    title: string
    analysis_result: {
      ai_analysis?: {
        suggestions: Array<{
          placeholder: string
          mapped_field: string
          confidence: number
          reasoning: string
        }>
        confidence_score: number
        analysis_summary: string
        recommendations: string
      }
      placeholders: string[]
      matched_fields: string[]
      missing_fields: string[]
    }
    field_mappings: Record<string, string>
  }
  onUpdate: () => void
  onClose: () => void
}

export function AIAnalysisReview({ template, onUpdate, onClose }: AIAnalysisReviewProps) {
  const [approvedMappings, setApprovedMappings] = useState<Record<string, boolean>>({})
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({})
  const [applying, setApplying] = useState(false)
  const { toast } = useToast()

  const aiAnalysis = template.analysis_result.ai_analysis
  const suggestions = aiAnalysis?.suggestions || []
  const confidenceScore = aiAnalysis?.confidence_score || 0

  const handleApproveMapping = (placeholder: string, approved: boolean) => {
    setApprovedMappings(prev => ({
      ...prev,
      [placeholder]: approved
    }))
  }

  const handleCustomMapping = (placeholder: string, field: string) => {
    setCustomMappings(prev => ({
      ...prev,
      [placeholder]: field
    }))
  }

  const applyMappings = async (mode: 'automatic' | 'manual') => {
    setApplying(true)
    try {
      let finalMappings = { ...template.field_mappings }
      
      if (mode === 'automatic') {
        // Apply all AI suggestions with high confidence
        suggestions.forEach(suggestion => {
          if (suggestion.confidence >= 70 && suggestion.mapped_field !== 'no_match') {
            finalMappings[suggestion.placeholder] = suggestion.mapped_field
          }
        })
      } else {
        // Apply only approved mappings and custom mappings
        suggestions.forEach(suggestion => {
          if (approvedMappings[suggestion.placeholder] && suggestion.mapped_field !== 'no_match') {
            finalMappings[suggestion.placeholder] = suggestion.mapped_field
          }
        })
        
        // Apply custom mappings
        Object.entries(customMappings).forEach(([placeholder, field]) => {
          if (field && field !== 'no_match') {
            finalMappings[placeholder] = field
          }
        })
      }

      // Update template in database
      const { error } = await supabase
        .from('document_templates')
        .update({ field_mappings: finalMappings })
        .eq('id', template.id)

      if (error) throw error

      toast({
        title: "Mappings Applied",
        description: `Successfully updated ${Object.keys(finalMappings).length} field mappings using ${mode} mode.`,
      })

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error applying mappings:', error)
      toast({
        title: "Error",
        description: "Failed to apply mappings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setApplying(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge className="bg-green-500">High</Badge>
    if (confidence >= 60) return <Badge className="bg-yellow-500">Medium</Badge>
    return <Badge className="bg-red-500">Low</Badge>
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            AI Analysis Results
            <Badge className={`ml-2 ${confidenceScore >= 70 ? 'bg-green-500' : confidenceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
              {confidenceScore}% Confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Summary</h4>
            <p className="text-sm text-muted-foreground">
              {aiAnalysis?.analysis_summary || 'No AI analysis available'}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <p className="text-sm text-muted-foreground">
              {aiAnalysis?.recommendations || 'No recommendations available'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{suggestions.length}</div>
              <div className="text-xs text-muted-foreground">AI Suggestions</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {suggestions.filter(s => s.confidence >= 70).length}
              </div>
              <div className="text-xs text-muted-foreground">High Confidence</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {suggestions.filter(s => s.mapped_field === 'no_match').length}
              </div>
              <div className="text-xs text-muted-foreground">No Match</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions Review */}
      <Card>
        <CardHeader>
          <CardTitle>Review AI Suggestions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review each AI suggestion and approve or modify the field mappings
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{suggestion.placeholder}</Badge>
                    <span className="text-sm text-muted-foreground">→</span>
                    <Badge variant="secondary">{suggestion.mapped_field}</Badge>
                    {getConfidenceBadge(suggestion.confidence)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.reasoning}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                    {suggestion.confidence}%
                  </span>
                </div>
              </div>

              {suggestion.mapped_field !== 'no_match' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={approvedMappings[suggestion.placeholder] === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleApproveMapping(suggestion.placeholder, true)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant={approvedMappings[suggestion.placeholder] === false ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleApproveMapping(suggestion.placeholder, false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newField = prompt(`Enter custom field for "${suggestion.placeholder}":`, suggestion.mapped_field)
                      if (newField) handleCustomMapping(suggestion.placeholder, newField)
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Custom
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => applyMappings('automatic')}
          disabled={applying}
          className="flex-1"
        >
          {applying ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Auto-Apply High Confidence (70%+)
        </Button>
        
        <Button
          onClick={() => applyMappings('manual')}
          disabled={applying}
          variant="outline"
          className="flex-1"
        >
          {applying ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Apply Selected Only
        </Button>
        
        <Button
          onClick={onClose}
          variant="ghost"
          disabled={applying}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}