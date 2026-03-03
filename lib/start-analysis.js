/**
 * Start security analysis using AWS workflow with RAG-enabled agents
 * This integrates with the existing workflow configuration
 *
 * SECURITY CONSTRAINTS:
 * - Reviewer agent strictly limited to submitted source code
 * - Only explicitly selected PDFs are used as knowledge sources
 * - Only predefined prompts are used - no external knowledge inference
 */

export async function startSecurityAnalysis({ userId, groupIds, code, codeType }) {
  try {
    // Get agent configurations from workflow configuration
    const agentConfigurations = getAgentConfigurations();
    
    // Get selected documents for RAG - CRITICAL: Only these will be used
    const selectedDocuments = getSelectedDocuments();
    
    // SECURITY: Enforce RAG — at least one knowledge base document MUST be selected
    if (!selectedDocuments || selectedDocuments.length === 0) {
      throw new Error(
        'At least one knowledge base document must be selected for security review. ' +
        'Please configure your review and select documents from the knowledge base before starting.'
      );
    }

    // SECURITY: Log document selection
    console.log(`[startSecurityAnalysis] Starting with ${selectedDocuments.length} selected documents`);

    // Fetch use cases for the selected groups
    const useCaseIds = [];
    for (const groupId of groupIds) {
      try {
        const response = await fetch(`/api/use-cases?groupId=${groupId}`);
        if (response.ok) {
          const data = await response.json();
          const useCases = data.data?.useCases || data.useCases || [];
          useCaseIds.push(...useCases.map(uc => uc.id));
        }
      } catch (error) {
        console.error(`Error fetching use cases for group ${groupId}:`, error);
      }
    }
    
    if (useCaseIds.length === 0) {
      throw new Error('No use cases found for the selected groups');
    }
    
    // Start the workflow
    const response = await fetch('/api/workflow/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        useCaseIds,
        selectedDocuments, // CRITICAL: Only these documents will be used
        agentConfigurations, // Includes prompt IDs
        metadata: {
          code, // This can now be either single file or project structure
          codeType,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[startSecurityAnalysis] API Error:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to start workflow');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error starting workflow:', error);
    throw error;
  }
}

/**
 * Get selected use case groups from workflow configuration
 */
export function getSelectedGroups() {
  try {
    // Check if there are selected groups in localStorage or context
    const saved = localStorage.getItem('vulniq_selected_groups');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error loading selected groups:', err);
  }
  return [];
}

/**
 * Save selected groups for workflow configuration
 */
export function saveSelectedGroups(groupIds) {
  try {
    localStorage.setItem('vulniq_selected_groups', JSON.stringify(groupIds));
  } catch (err) {
    console.error('Error saving selected groups:', err);
  }
}

/**
 * Get agent configurations from workflow configuration
 * Includes both custom prompt text and prompt ID for tracking
 */
export function getAgentConfigurations() {
  try {
    const saved = localStorage.getItem('vulniq_agent_configurations');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error loading agent configurations:', err);
  }
  
  // Default configuration: Reviewer and Reporter enabled
  return {
    reviewer: {
      enabled: true,
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      customPrompt: '',
      promptId: '', // Track which predefined prompt is being used
    },
    implementer: {
      enabled: false,
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      customPrompt: '',
      promptId: '',
    },
    tester: {
      enabled: false,
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      customPrompt: '',
      promptId: '',
    },
    reporter: {
      enabled: true,
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      customPrompt: '',
      promptId: '',
    },
  };
}

/**
 * Save agent configurations for workflow
 */
export function saveAgentConfigurations(configurations) {
  try {
    localStorage.setItem('vulniq_agent_configurations', JSON.stringify(configurations));
  } catch (err) {
    console.error('Error saving agent configurations:', err);
  }
}

/**
 * Get selected documents for RAG context
 */
export function getSelectedDocuments() {
  try {
    const saved = localStorage.getItem('vulniq_selected_documents');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error loading selected documents:', err);
  }
  return [];
}

/**
 * Save selected documents for RAG context
 */
export function saveSelectedDocuments(documentIds) {
  try {
    localStorage.setItem('vulniq_selected_documents', JSON.stringify(documentIds));
  } catch (err) {
    console.error('Error saving selected documents:', err);
  }
}
