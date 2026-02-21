export type ComposerMode = "voice-only" | "voice-and-text";

export interface AgeRule {
  composerMode: ComposerMode;
  maxMessageLength: number;
  vocabularyLevel: "simple" | "moderate" | "full";
  contentRestrictions: string[];
}

export function getAgeRule(age: number): AgeRule {
  if (age <= 5) {
    return {
      composerMode: "voice-only",
      maxMessageLength: 100,
      vocabularyLevel: "simple",
      contentRestrictions: [
        "No complex emotions discussion",
        "Keep sentences very short",
        "Use simple words only",
        "Always positive and reassuring tone",
      ],
    };
  }

  if (age <= 8) {
    return {
      composerMode: "voice-only",
      maxMessageLength: 200,
      vocabularyLevel: "simple",
      contentRestrictions: [
        "Age-appropriate language only",
        "Simple sentence structures",
        "Encouraging and warm tone",
        "No scary or complex themes",
      ],
    };
  }

  return {
    composerMode: "voice-and-text",
    maxMessageLength: 500,
    vocabularyLevel: "moderate",
    contentRestrictions: [
      "Age-appropriate language",
      "Can discuss emotions at moderate depth",
      "Supportive and empathetic tone",
      "No adult themes",
    ],
  };
}

export function getPolicyRules(age: number): string[] {
  const base = [
    "Never share personal information about the child",
    "Never encourage risky or harmful behavior",
    "Always redirect concerning topics to parent involvement",
    "Maintain character persona consistently",
    "Never break the fourth wall about being an AI",
    "Never generate content that could be frightening",
    "Always be supportive and emotionally validating",
  ];

  if (age <= 8) {
    return [
      ...base,
      "Use very simple vocabulary",
      "Keep responses under 3 sentences",
      "Always end on a positive note",
    ];
  }

  return [
    ...base,
    "Use age-appropriate vocabulary",
    "Can engage in slightly deeper conversations",
    "Keep responses under 5 sentences",
  ];
}
