// Defines data structure references for the AI Therapy Agent 

export const TherapyAgentMemory = {
  userProfile: {
    emotionalState: [],
    riskLevel: 0,
    preferences: {},
  },
  sessionContext: {
    conversationThemes: [],
    currentTechnique: null,
  },
};

export const MessageAnalysis = {
  emotionalState: "",
  riskLevel: 0,
  themes: [],
  recommendedApproach: "",
  progressIndicators: [],
};

export const InngestResponse = (id, data) => ({
  id,
  data,
});

export const InngestMessageData = {
  response: "",
  analysis: { ...MessageAnalysis },
  updatedMemory: { ...TherapyAgentMemory },
};

export const InngestSessionData = {
  sessionId: "",
  userId: "",
  startTime: new Date(),
};

export const InngestEventData = {
  message: "",
  history: [],
  memory: { ...TherapyAgentMemory },
  goals: [],
  systemPrompt: "",
  sessionId: "",
  userId: "",
  startTime: new Date(),
};

export const createInngestMessageResponse = (id, data) =>
  InngestResponse(id, data);

export const createInngestSessionResponse = (id, data) =>
  InngestResponse(id, data);

export const InngestEvent = {
  name: "",
  data: { ...InngestEventData },
};
