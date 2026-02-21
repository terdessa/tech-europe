# Dust Integration Setup

Lumio uses the **Dust Conversations API** to power emotion analysis, safety gating, parent adviser, missions, and weekly summaries.

## Configuration

Add these to your `.env`:

```
DUST_API_KEY=sk-your-api-key-here
DUST_WORKSPACE_ID=your-workspace-id
DUST_AGENT_ID=dust          # optional, defaults to "dust" global agent
```

### Where to find these values

1. Log in to [dust.tt](https://dust.tt)
2. Go to **Settings > API Keys** to create/copy your API key
3. Your **Workspace ID** is in the URL: `https://dust.tt/w/{WORKSPACE_ID}/...`
4. **Agent ID** (optional): defaults to the `dust` global agent. If you create a custom agent, use its `sId` from the agent config page

## How it works

The app sends structured prompts to Dust via the Conversations API with `blocking: true`, which means:
- Each call creates a short-lived conversation
- The agent processes the prompt and returns a synchronous response
- The response is parsed as JSON matching the expected schema

### Agent roles

| Role | Purpose | Fallback |
|------|---------|----------|
| **Emotion Interpreter** | Analyzes child's mood from messages | Returns neutral mood |
| **Safety Gate** | Reviews AI draft replies for policy compliance | Passes draft through unchanged |
| **Parent Adviser** | Answers parent questions about child wellbeing | Falls back to Gemini |
| **Mission Suggester** | Creates fun educational missions | Requires Dust |
| **Weekly Summary** | Generates weekly reports for parents | Requires Dust |

### Fallback behavior

- **Emotion & Safety**: If Dust is not configured (no API key), these fall back to safe defaults so the chat pipeline still works
- **Adviser**: Falls back to Gemini if Dust fails
- **Missions & Weekly Summary**: Require Dust to be configured

## Custom Agents (optional)

For better results, you can create dedicated agents in your Dust workspace:

1. Create a new agent in Dust with specific instructions for each role
2. Set the agent's `sId` as `DUST_AGENT_ID` in `.env`, or create separate agents and modify the code to use different agent IDs per role

The default `dust` global agent works well since each call includes a detailed system prompt describing the expected role and output format.
