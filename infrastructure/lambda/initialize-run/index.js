/**
 * Initialize Run Lambda Function
 * Prepares run context for Step Functions workflow
 * 
 * This is a simplified version that works with the data passed from the API
 */

exports.handler = async (event) => {
    console.log('Initialize Run - Event:', JSON.stringify(event, null, 2));
    
    try {
        const { runId, userId, useCases } = event;
        
        if (!runId || !userId || !useCases) {
            throw new Error('Missing required fields: runId, userId, or useCases');
        }
        
        console.log(`Initializing run ${runId} for user ${userId}`);
        console.log(`Processing ${useCases.length} use cases`);
        
        // Get code and codeType from the first use case (they should all have the same code)
        const code = useCases[0]?.code || '';
        const codeType = useCases[0]?.codeType || 'Unknown';
        
        // Add code and codeType to each use case
        const enrichedUseCases = useCases.map(uc => ({
            ...uc,
            code: code,
            codeType: codeType
        }));
        
        // Return the context needed by Step Functions
        const runContext = {
            useCases: enrichedUseCases,
            useCaseCount: useCases.length,
            timestamp: new Date().toISOString()
        };
        
        console.log('Run context prepared successfully');
        
        return runContext;
        
    } catch (error) {
        console.error('Error initializing run:', error);
        throw error;
    }
};
