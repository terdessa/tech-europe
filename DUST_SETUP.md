# Dust Agent Setup Guide

This document explains how to connect the 5 Dust agents to Lumio.

## 1. Get Webhook URLs

For each agent you created in Dust, go to the agent's **Triggers** tab and copy the webhook URL. It looks something like:

```
https://dust.tt/api/v1/w/<workspace>/agents/<agent-id>/webhook/<trigger-name>
```

## 2. Set Environment Variables

Paste each webhook URL into your `.env` file:

```env
DUST_EMOTION_WEBHOOK=<Agent 1 webhook URL — emotion_interpreter>
DUST_SAFETY_WEBHOOK=<Agent 2 webhook URL — safety_gate_rewrite>
DUST_ADVISER_WEBHOOK=<Agent 3 webhook URL — parent_adviser>
DUST_MISSIONS_WEBHOOK=<Agent 4 webhook URL — mission_suggestions>
DUST_WEEKLY_SUMMARY_WEBHOOK=<Agent 5 webhook URL — weekly_summary>
```

Restart the dev server after updating `.env`.

## 3. Agent-Specific Notes

### Agent 1 — Emotion Interpreter

Your config is correct. One small note:

**`moodHistory`**: Our app sends this as a flat string array (`["happy", "neutral", "sad"]`) rather than `{date, dominantMood}` objects. Your agent instructions say "array of { date, dominantMood }".

**Fix in Dust instructions** — change line:
```
- moodHistory: array of { date: string, dominantMood: string }
```
to:
```
- moodHistory: array of strings (e.g. ["happy", "neutral", "excited"])
```

**`activeMission`**: We send the mission title as a string (or null), which matches your schema.

Everything else matches.

---

### Agent 2 — Safety Gate + Rewrite

Your config is correct. No changes needed.

Our app sends:
- `child: { name, age }` — matches
- `kidMessage` — matches
- `assistantDraft` — matches
- `conversationHistory: [{ role, text }]` — matches
- `policy: { disallowed: [...] }` — matches

---

### Agent 3 — Parent Adviser

Your config is correct. Two small notes:

**`missions`**: Your agent instructions expect a `missions` array, but our app currently sends an empty array `[]` for this field. This is fine — missions data is available elsewhere and will be wired in when the parent adviser feature is fully built out.

**`recentChats`**: We send `{ role, text, createdAt, mood, topics }` which matches your schema.

---

### Agent 4 — Mission Suggestions

Your config is correct. One small note:

**`currentMissions`**: Your agent instructions expect `string[]`, and we send an array of mission title strings. This matches.

---

### Agent 5 — Weekly Summary

Your config is correct. No changes needed.

---

## 4. Testing

Once webhooks are set, chat with a character. You should see:
- **Emotion analysis** logged per message (mood, triggers, tone guidance)
- **Safety gate** checking each Gemini reply before it reaches the child
- Fallback mode is used when webhooks are not set (neutral mood, draft passed through)

To test parent-facing agents (Adviser, Missions, Weekly Summary), use the corresponding parent dashboard pages.

## 5. Troubleshooting

| Symptom | Fix |
|---|---|
| `DUST_EMOTION_WEBHOOK not configured` | Webhook URL missing from `.env` — chat still works with fallback |
| `Dust webhook error (401)` | Check that the webhook URL is correct and your Dust workspace allows API access |
| `Dust webhook error (422)` | Input format mismatch — check the agent's structured response format |
| Agent returns unexpected JSON shape | Verify the structured response format in Dust matches the schemas in this doc |
