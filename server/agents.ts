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
5. Compliance checkboxes that must be satisfied
6. Risk rating (Low / Medium / High / Critical)

Be conversational but thorough. Keep responses focused and under 300 words. Use plain language accessible to non-technical stakeholders.`,
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

Be conversational but thorough. Keep responses focused and under 300 words. Use plain language accessible to non-technical stakeholders.`,
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

Be conversational but thorough. Keep responses focused and under 300 words. Use plain language accessible to non-technical stakeholders.`,
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

Be conversational but thorough. Keep responses focused and under 300 words. Use plain language accessible to non-technical stakeholders.`,
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

Be conversational but thorough. Keep responses focused and under 300 words. Use plain language accessible to non-technical stakeholders.`,
  },
];

export type SSECallback = (event: {
  type: string;
  persona?: string;
  round?: number;
  content?: string;
  summary?: string;
  status?: string;
}) => void;

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
    // Round 1: Initial individual assessments (parallel)
    onEvent({ type: "round_start", round: 1 });

    const round1Promises = personas.map(async (persona) => {
      onEvent({
        type: "persona_thinking",
        persona: persona.id,
        round: 1,
      });

      const prompt = `A colleague at ENMAX has proposed the following idea:\n\n"${idea}"\n\nPlease evaluate this idea from your perspective as ${persona.role} in ${persona.department}. What are the key considerations, recommendations, and potential concerns?`;

      const content = await callOpenRouter(persona.systemPrompt, prompt, apiKey);

      insertMessage.run(
        nanoid(),
        sessionId,
        persona.id,
        1,
        content,
        "complete"
      );

      onEvent({
        type: "persona_response",
        persona: persona.id,
        round: 1,
        content,
      });

      return { persona: persona.id, content };
    });

    const round1Results = await Promise.all(round1Promises);
    onEvent({ type: "round_complete", round: 1 });

    // Round 2: Cross-discussion (parallel, but with context from round 1)
    onEvent({ type: "round_start", round: 2 });

    const round1Summary = round1Results
      .map((r) => {
        const p = personas.find((p) => p.id === r.persona)!;
        return `**${p.name} (${p.department}):** ${r.content}`;
      })
      .join("\n\n---\n\n");

    const round2Promises = personas.map(async (persona) => {
      onEvent({
        type: "persona_thinking",
        persona: persona.id,
        round: 2,
      });

      const prompt = `A colleague at ENMAX proposed this idea:\n\n"${idea}"\n\nHere are the initial assessments from all department specialists:\n\n${round1Summary}\n\nNow, review your colleagues' assessments. Do you agree or disagree with any points? Are there cross-cutting concerns between departments? What additional considerations arise from seeing everyone's perspective? Keep your response brief and focused — highlight only the most important cross-department insights (under 200 words).`;

      const content = await callOpenRouter(persona.systemPrompt, prompt, apiKey);

      insertMessage.run(
        nanoid(),
        sessionId,
        persona.id,
        2,
        content,
        "complete"
      );

      onEvent({
        type: "persona_response",
        persona: persona.id,
        round: 2,
        content,
      });

      return { persona: persona.id, content };
    });

    const round2Results = await Promise.all(round2Promises);
    onEvent({ type: "round_complete", round: 2 });

    // Round 3: Synthesis
    onEvent({ type: "round_start", round: 3 });
    onEvent({ type: "persona_thinking", persona: "orchestrator", round: 3 });

    const round2Summary = round2Results
      .map((r) => {
        const p = personas.find((p) => p.id === r.persona)!;
        return `**${p.name} (${p.department}):** ${r.content}`;
      })
      .join("\n\n---\n\n");

    const synthesisPrompt = `You are the ENMAX Spark Orchestrator. Your job is to synthesize a team evaluation into a clear, actionable plan.

An ENMAX employee proposed this idea:

"${idea}"

Here are the Round 1 individual assessments:

${round1Summary}

Here are the Round 2 cross-discussion insights:

${round2Summary}

Please create a final synthesis that includes:

1. **Verdict** — Is this idea feasible and worth pursuing? (Go / Go with Conditions / Needs More Research / Not Recommended)
2. **Executive Summary** — 2-3 sentence overview
3. **Departments Involved** — Which teams need to participate and their key responsibilities
4. **Recommended Approach** — Phased plan with clear milestones
5. **Key Risks & Mitigations** — Top 3-5 risks and how to address them
6. **Estimated Effort & Cost** — High-level sizing
7. **Immediate Next Steps** — What should happen in the next 2 weeks

Format this clearly with markdown headers. Be decisive and actionable.`;

    const synthesis = await callOpenRouter(
      "You are a strategic technology advisor synthesizing expert evaluations into clear, actionable plans for non-technical stakeholders.",
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

    onEvent({
      type: "synthesis",
      round: 3,
      content: synthesis,
    });

    onEvent({ type: "round_complete", round: 3 });
    onEvent({ type: "evaluation_complete", status: "complete" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    updateSession.run("error", message, sessionId);
    onEvent({ type: "error", content: message });
  }
}
