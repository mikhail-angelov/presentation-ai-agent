import { store, actionCreators } from "./store";

// Dispatcher utility for easy access to store actions
export const dispatcher = {
  // Step management
  setActiveStep: (step: Parameters<typeof actionCreators.setActiveStep>[0]) => {
    store.dispatch(actionCreators.setActiveStep(step));
  },

  updateStepContent: (step: Parameters<typeof actionCreators.updateStepContent>[0], content: Parameters<typeof actionCreators.updateStepContent>[1]) => {
    store.dispatch(actionCreators.updateStepContent(step, content));
  },

  // UI states
  addLLMRequest: (request: Parameters<typeof actionCreators.addLLMRequest>[0]) => {
    store.dispatch(actionCreators.addLLMRequest(request));
  },

  setIsGenerating: (isGenerating: Parameters<typeof actionCreators.setIsGenerating>[0]) => {
    store.dispatch(actionCreators.setIsGenerating(isGenerating));
  },

  setStreamingContent: (content: Parameters<typeof actionCreators.setStreamingContent>[0]) => {
    store.dispatch(actionCreators.setStreamingContent(content));
  },

  setAbortController: (controller: Parameters<typeof actionCreators.setAbortController>[0]) => {
    store.dispatch(actionCreators.setAbortController(controller));
  },

  // Modal state
  setShowSlidesModal: (show: Parameters<typeof actionCreators.setShowSlidesModal>[0]) => {
    store.dispatch(actionCreators.setShowSlidesModal(show));
  },

  setGeneratedSlidesHTML: (html: Parameters<typeof actionCreators.setGeneratedSlidesHTML>[0]) => {
    store.dispatch(actionCreators.setGeneratedSlidesHTML(html));
  },

  // Image generation progress
  setImageGenerationProgress: (progress: Parameters<typeof actionCreators.setImageGenerationProgress>[0]) => {
    store.dispatch(actionCreators.setImageGenerationProgress(progress));
  },

  // Reset state
  resetState: () => {
    store.dispatch(actionCreators.resetState());
  },

  // Load presentation
  loadPresentation: (stepContents: Parameters<typeof actionCreators.loadPresentation>[0], generatedSlidesHTML?: Parameters<typeof actionCreators.loadPresentation>[1]) => {
    store.dispatch(actionCreators.loadPresentation(stepContents, generatedSlidesHTML));
  },
};

// Helper functions that combine multiple dispatches
export const dispatcherHelpers = {
  // Navigate to step and update history
  navigateToStep: (step: Parameters<typeof actionCreators.setActiveStep>[0]) => {
    dispatcher.setActiveStep(step);
  },

  // Update step content and handle htmlSlides special case
  updateStepContentWithHtmlSync: (step: Parameters<typeof actionCreators.updateStepContent>[0], content: Parameters<typeof actionCreators.updateStepContent>[1]) => {
    dispatcher.updateStepContent(step, content);
    
    // Also update generatedSlidesHTML if htmlSlides is being updated
    if (step === "htmlSlides" && typeof content === "string") {
      dispatcher.setGeneratedSlidesHTML(content);
    }
  },

  // Cancel generation
  cancelGeneration: () => {
    const state = store.getState();
    if (state.abortController) {
      state.abortController.abort();
      dispatcher.setAbortController(null);
    }
    dispatcher.setIsGenerating(false);
    dispatcher.setStreamingContent("");
  },
};