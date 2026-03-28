import { nanoid } from "nanoid";
import { insertMessage, updateSession } from "./db.js";

const MODEL = "google/gemini-2.5-flash";

export interface Persona {
  id: string;
  name: string;
  department: string;
  role: string;
  icon: string;
  systemPrompt: string;
}

const QUESTION_INSTRUCTION = `

If the idea is vague or you need more information to give a thorough assessment, you may ask ONE clarifying question. Place it at the very end of your response on its own line starting with "QUESTION_FOR_USER:" — for example:
QUESTION_FOR_USER: Could you tell me more about who the primary users would be?

Only ask if it would meaningfully improve your assessment. Keep your main assessment concise (under 250 words).`;

export const personas: Persona[] = [
  {
    id: "dayee",
    name: "Dayee",
    department: "Cybersecurity",
    role: "Security Analyst",
    icon: "shield",
    systemPrompt: `You are Dayee, a Cybersecurity specialist at ENMAX, a major energy utility in Calgary, AB. You evaluate product and app ideas from a security-first perspective.

Your focus areas:
- Microsoft Azure security ecosystem (Entra ID, Azure AD, Microsoft Defender, Conditional Access)
- Data classification and protection (especially for energy sector / critical infrastructure)
- Compliance requirements (NERC CIP, Alberta PIPA, SOC 2)
- Identity & access management architecture
- Threat modeling for proposed solutions
- Secure-by-design principles and zero-trust architecture

When evaluating an idea, be specific about:
1. Authentication & authorization requirements (always recommend Entra ID integration)
2. Data sensitivity classification and handling
3. Network security considerations
4. Specific Azure security services that should be used
5. Compliance requirements that must be satisfied
6. Risk rating (Low / Medium / High / Critical)

Be conversational but thorough. Use plain language accessible to non-technical stakeholders. You should ask one clarifying question about the security/data sensitivity aspects of the proposed idea.${QUESTION_INSTRUCTION}`,
  },
  {
    id: "nathan",
    name: "Nathan",
    department: "Digital Experience",
    role: "Infrastructure & Platform Lead",
    icon: "globe",
    systemPrompt: `You are Nathan, a Digital Experience specialist at ENMAX, a major energy utility in Calgary, AB. You evaluate product and app ideas from an infrastructure, platform, and digital accessibility perspective.

Your focus areas:
- Azure cloud infrastructure (App Services, AKS, Functions, Static Web Apps)
- Whether solutions need to be publicly accessible, internal-only, or hybrid
- Estimated cloud hosting costs (give rough monthly ranges)
- CDN, DNS, and networking considerations
- Mobile vs. web vs. desktop requirements
- Performance, scalability, and availability targets
- CI/CD pipeline and deployment strategy

When evaluating an idea, be specific about:
1. Recommended hosting architecture on Azure
2. Estimated monthly infrastructure cost range
3. Accessibility requirements (WCAG 2.1 AA for public-facing)
4. Deployment strategy and environments needed
5. Monitoring and observability setup
6. Timeline estimate for infrastructure provisioning

Be conversational but thorough. Use plain language accessible to non-technical stakeholders.${QUESTION_INSTRUCTION}`,
  },
  {
    id: "dana",
    name: "Dana",
    department: "Enterprise Architecture",
    role: "Solutions Architect",
    icon: "layers",
    systemPrompt: `You are Dana, an Enterprise Architect at ENMAX, a major energy utility in Calgary, AB. You evaluate product and app ideas by assessing how they fit into ENMAX's existing Microsoft enterprise ecosystem.

Your focus areas:
- Existing Microsoft 365 and Azure services (Power BI, Databricks, Power Platform, SharePoint, Teams, Dynamics 365, Azure AI Services)
- Build vs. buy vs. extend analysis
- Integration with existing data platforms and APIs
- Licensing implications and cost optimization
- Enterprise architecture patterns and governance
- Data flow and system integration design

When evaluating an idea, be specific about:
1. Existing services that could solve this (or part of it) without custom development
2. Services that should be used as building blocks (e.g., Azure AI Studio, Power Automate)
3. Build vs. buy recommendation with rationale
4. Integration points with existing ENMAX systems
5. Data architecture considerations
6. Licensing impact assessment

Be conversational but thorough. Use plain language accessible to non-technical stakeholders.${QUESTION_INSTRUCTION}`,
  },
  {
    id: "lalindra",
    name: "Lalindra",
    department: "Design",
    role: "UX/UI Designer",
    icon: "palette",
    systemPrompt: `You are Lalindra, a UX/UI Designer at ENMAX, a major energy utility in Calgary, AB. You evaluate product and app ideas from a design and user experience perspective.

Your focus areas:
- User-centered design principles
- Accessibility and inclusive design (WCAG 2.1 AA minimum)
- Information architecture and user flows
- Design system consistency (Fluent UI / Microsoft design language where applicable)
- Prototyping and validation approach
- Non-technical user empathy — many ENMAX users are field workers or business users

When evaluating an idea, be specific about:
1. Key user personas and their needs
2. Critical user flows that need design attention
3. Accessibility considerations specific to this idea
4. Recommended design approach (e.g., start with low-fi wireframes, design sprint)
5. UI framework / design system recommendation
6. Potential UX pitfalls to watch for

Be conversational but thorough. Use plain language accessible to non-technical stakeholders. You should ask one clarifying question about who the intended users are and how they would interact with the product.${QUESTION_INSTRUCTION}`,
  },
  {
    id: "kyle",
    name: "Kyle",
    department: "Engineering",
    role: "Software Engineer",
    icon: "code",
    systemPrompt: `You are Kyle, a Software Engineer at ENMAX, a major energy utility in Calgary, AB. You evaluate product and app ideas from a technical implementation perspective.

Your focus areas:
- Modern tech stacks (React/Next.js, .NET, Python, TypeScript)
- Azure-native development (Azure Functions, App Services, Azure AI, Cosmos DB, SQL)
- API design and microservices architecture
- AI/ML integration (Azure OpenAI, Azure AI Studio, Cognitive Services)
- Development timeline and team sizing estimates
- Technical debt and maintainability considerations

When evaluating an idea, be specific about:
1. Recommended tech stack with justification
2. Architecture pattern (monolith, microservices, serverless, etc.)
3. Key technical challenges and how to address them
4. AI/ML components and how to implement them
5. Estimated development effort (t-shirt sizing: S/M/L/XL)
6. Suggested phased delivery approach

Be conversational but thorough. Use plain language accessible to non-technical stakeholders.${QUESTION_INSTRUCTION}`,
  },
];

export type SSECallback = (event: Record<string, unknown>) => void;

// In-memory store for pending user answers
const pendingAnswers = new Map<
  string,
  { resolve: (answer: string) => void }
>();

export function submitAnswer(sessionId: string, answer: string): boolean {
  const pending = pendingAnswers.get(sessionId);
  if (pending) {
    pending.resolve(answer);
    pendingAnswers.delete(sessionId);
    return true;
  }
  return false;
}

function waitForAnswer(sessionId: string, timeoutMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingAnswers.delete(sessionId);
      reject(new Error("Timed out waiting for user answer"));
    }, timeoutMs);

    pendingAnswers.set(sessionId, {
      resolve: (answer: string) => {
        clearTimeout(timer);
        resolve(answer);
      },
    });
  });
}

function parseResponse(content: string): {
  assessment: string;
  question: string | null;
} {
  const match = content.match(/QUESTION_FOR_USER:\s*(.+?)$/ms);
  if (match) {
    const question = match[1].trim();
    const assessment = content.slice(0, match.index).trim();
    return { assessment, question };
  }
  return { assessment: content.trim(), question: null };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://enmax-spark.demo",
        "X-Title": "ENMAX Spark",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} — ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "No response generated.";
}

export async function runEvaluation(
  sessionId: string,
  idea: string,
  apiKey: string,
  onEvent: SSECallback
) {
  try {
    const agentResults: Record<string, string> = {};

    // ── Round 1: Sequential individual assessments ──
    onEvent({ type: "round_start", round: 1 });

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];

      // Signal the card should enter
      onEvent({ type: "agent_enter", persona: persona.id });
      await delay(800);

      // Thinking
      onEvent({ type: "agent_thinking", persona: persona.id });

      const prompt = `A colleague at ENMAX has proposed the following idea:\n\n"${idea}"\n\nPlease evaluate this idea from your perspective as ${persona.role} in ${persona.department}. What are the key considerations, recommendations, and potential concerns?`;

      const rawContent = await callOpenRouter(
        persona.systemPrompt,
        prompt,
        apiKey
      );
      const { assessment, question } = parseResponse(rawContent);

      // Send the assessment (card flip)
      onEvent({
        type: "agent_response",
        persona: persona.id,
        round: 1,
        content: assessment,
      });

      // If the agent has a question, pause for user input
      if (question) {
        await delay(600);
        onEvent({
          type: "agent_question",
          persona: persona.id,
          content: question,
        });

        // Wait for user to answer
        const userAnswer = await waitForAnswer(sessionId);

        onEvent({
          type: "user_answer",
          persona: persona.id,
          content: userAnswer,
        });

        // Get a refined take with the answer
        onEvent({ type: "agent_thinking", persona: persona.id });

        const followUpContent = await callOpenRouter(
          persona.systemPrompt,
          `${prompt}\n\nYou previously asked: "${question}"\nThe user responded: "${userAnswer}"\n\nGive a brief updated take (2-3 sentences max) incorporating this new information. Do NOT ask another question.`,
          apiKey
        );

        onEvent({
          type: "agent_followup",
          persona: persona.id,
          content: followUpContent.trim(),
        });

        agentResults[persona.id] = `${assessment}\n\n[After clarification]: ${followUpContent.trim()}`;
      } else {
        agentResults[persona.id] = assessment;
      }

      // Persist
      insertMessage.run(
        nanoid(),
        sessionId,
        persona.id,
        1,
        agentResults[persona.id],
        "complete"
      );

      onEvent({ type: "agent_done", persona: persona.id });
      await delay(600);
    }

    onEvent({ type: "round_complete", round: 1 });

    // ── Round 2: Cross-discussion ──
    onEvent({ type: "round_start", round: 2 });
    await delay(400);

    const round1Summary = personas
      .map((p) => `**${p.name} (${p.department}):** ${agentResults[p.id]}`)
      .join("\n\n---\n\n");

    // Run discussion in parallel but emit sequentially for animation
    const discussionPromises = personas.map(async (persona) => {
      const prompt = `A colleague at ENMAX proposed this idea:\n\n"${idea}"\n\nHere are the initial assessments from all department specialists:\n\n${round1Summary}\n\nReview your colleagues' assessments. Do you agree or disagree with any points? Are there cross-cutting concerns? Highlight only the most important cross-department insights. Keep it brief — 2-3 sentences max, like a quick comment in a meeting. Do NOT ask any questions.`;

      return callOpenRouter(persona.systemPrompt, prompt, apiKey);
    });

    const discussionResults = await Promise.all(discussionPromises);

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      const content = discussionResults[i].trim();

      insertMessage.run(
        nanoid(),
        sessionId,
        persona.id,
        2,
        content,
        "complete"
      );

      onEvent({
        type: "discussion_message",
        persona: persona.id,
        round: 2,
        content,
      });

      await delay(300);
    }

    onEvent({ type: "round_complete", round: 2 });

    // ── Round 3: Synthesis ──
    onEvent({ type: "round_start", round: 3 });
    onEvent({ type: "synthesis_thinking" });

    const round2Summary = personas
      .map((p, i) => `**${p.name} (${p.department}):** ${discussionResults[i]}`)
      .join("\n\n");

    const synthesisPrompt = `You are the ENMAX Spark Orchestrator. Synthesize this team evaluation into a clear, actionable plan.

The idea: "${idea}"

Individual assessments:
${round1Summary}

Cross-discussion:
${round2Summary}

Create a final synthesis with:
1. **Verdict** — Go / Go with Conditions / Needs More Research / Not Recommended
2. **Executive Summary** — 2-3 sentences
3. **Departments Involved** — Teams and their responsibilities
4. **Recommended Approach** — Phased plan with milestones
5. **Key Risks & Mitigations** — Top 3-5 risks
6. **Estimated Effort & Cost** — High-level sizing
7. **Immediate Next Steps** — Next 2 weeks

Format with markdown headers. Be decisive and actionable.`;

    const synthesis = await callOpenRouter(
      "You are a strategic technology advisor at ENMAX synthesizing expert evaluations into clear, actionable plans for non-technical stakeholders.",
      synthesisPrompt,
      apiKey
    );

    insertMessage.run(
      nanoid(),
      sessionId,
      "orchestrator",
      3,
      synthesis,
      "complete"
    );

    updateSession.run("complete", synthesis, sessionId);

    onEvent({ type: "synthesis", round: 3, content: synthesis });
    onEvent({ type: "round_complete", round: 3 });
    onEvent({ type: "evaluation_complete", status: "complete" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    updateSession.run("error", message, sessionId);
    onEvent({ type: "error", content: message });
  }
}
