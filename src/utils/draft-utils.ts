export const saveDraft = (formSlug: string, responses: Record<string, any>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      `form_draft_${formSlug}`,
      JSON.stringify({
        responses,
        timestamp: Date.now(),
      })
    );
  }
};

export const loadDraft = (formSlug: string): Record<string, any> | null => {
  if (typeof window !== "undefined") {
    const draft = localStorage.getItem(`form_draft_${formSlug}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Check if draft is less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.responses;
        } else {
          // Remove expired draft
          localStorage.removeItem(`form_draft_${formSlug}`);
        }
      } catch (error) {
        console.error("Error parsing draft:", error);
        localStorage.removeItem(`form_draft_${formSlug}`);
      }
    }
  }
  return null;
};

export const clearDraft = (formSlug: string) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`form_draft_${formSlug}`);
  }
};
