declare namespace chrome {
  export const aiOriginTrial: {
    languageModel: {
      capabilities(): Promise<{ available: "no" | "readily" | "after-download" }>;
      create(options?: { systemPrompt?: string; monitor?: (m: any) => void }): Promise<any>;
    };
  };
}
