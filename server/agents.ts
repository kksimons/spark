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

IMPORTANT: Do NOT ask a question that has already been asked by a colleague earlier in this session. Build on what has already been discussed. If a similar question was asked and answered, reference that information and ask something new that digs deeper into YOUR domain expertise. If the existing answers give you enough to work with, skip the question entirely.

Only ask if it would meaningfully improve your assessment and has NOT already been covered. Keep your main assessment concise (under 250 words).`;

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

const SECTION_ID_MAP: Record<string, string> = {
  verdict: "verdict",
  stakeholder: "stakeholder",
  departments: "departments",
  approach: "approach",
  architecture: "architecture",
  security: "security",
  design: "design",
  risks: "risks",
  effort: "effort",
};

function sectionIdForTitle(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, id] of Object.entries(SECTION_ID_MAP)) {
    if (lower.includes(key)) return id;
  }
  return `section-${title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}`;
}

function parseMarkdownSections(markdown: string): Array<{
  id: string;
  title: string;
  content: string;
  order: number;
}> {
  const lines = markdown.split("\n");
  const sections: Array<{ id: string; title: string; content: string; order: number }> = [];
  let currentTitle = "";
  let currentContent: string[] = [];
  let order = 0;

  const flush = () => {
    if (currentTitle) {
      sections.push({
        id: sectionIdForTitle(currentTitle),
        title: currentTitle,
        content: currentContent.join("\n").trim(),
        order,
      });
      order++;
    }
  };

  for (const line of lines) {
    const match = line.match(/^# (.+)$/);
    if (match) {
      flush();
      currentTitle = match[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  flush();

  return sections;
}

const PERSONA_SECTION_MAP: Record<string, Array<{ id: string; title: string; order: number }>> = {
  dayee: [
    { id: "security", title: "Security & Compliance", order: 5 },
  ],
  nathan: [
    { id: "architecture", title: "Technical Architecture", order: 4 },
    { id: "effort", title: "Estimated Effort & Cost", order: 8 },
  ],
  dana: [
    { id: "departments", title: "Departments Involved", order: 2 },
    { id: "approach", title: "Recommended Approach", order: 3 },
  ],
  lalindra: [
    { id: "design", title: "Design & User Experience", order: 6 },
  ],
  kyle: [
    { id: "risks", title: "Key Risks & Mitigations", order: 7 },
    { id: "architecture", title: "Technical Architecture", order: 4 },
  ],
};

function getSpecContributions(
  personaId: string,
  assessment: string
): Array<{ id: string; title: string; content: string; order: number }> {
  const sectionDefs = PERSONA_SECTION_MAP[personaId];
  if (!sectionDefs) return [];

  return sectionDefs.map((def) => ({
    ...def,
    content: assessment,
  }));
}

export function buildRound1Prompt(
  idea: string,
  personaIndex: number,
  allPersonas: Persona[],
  agentResults: Record<string, string>,
  qaHistory: Array<{ agentName: string; question: string; answer: string }>
): string {
  const persona = allPersonas[personaIndex];

  let priorContext = "";
  if (personaIndex > 0) {
    const priorAssessments = allPersonas.slice(0, personaIndex)
      .map((p) => `**${p.name} (${p.department}):** ${agentResults[p.id]}`)
      .join("\n\n---\n\n");
    priorContext = `\n\nHere are the assessments from colleagues who have already evaluated this idea:\n\n${priorAssessments}`;
  }
  if (qaHistory.length > 0) {
    const qaBlock = qaHistory
      .map((qa) => `- ${qa.agentName} asked: "${qa.question}" → User answered: "${qa.answer}"`)
      .join("\n");
    priorContext += `\n\nClarifying questions already asked and answered:\n${qaBlock}\n\nUse the above information in your assessment. Do NOT repeat points already made or ask about topics already covered. Focus on your unique domain perspective and add new insights.`;
  }

  return `A colleague at ENMAX has proposed the following idea:\n\n"${idea}"\n\nPlease evaluate this idea from your perspective as ${persona.role} in ${persona.department}. What are the key considerations, recommendations, and potential concerns?${priorContext}`;
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

    onEvent({
      type: "spec_skeleton",
      sections: [
        { id: "verdict", title: "Verdict", icon: "gavel", content: "", order: 0, status: "skeleton" },
        { id: "stakeholder", title: "Stakeholder Outreach & Next Steps", icon: "users", content: "", order: 1, status: "skeleton" },
        { id: "departments", title: "Departments Involved", icon: "building", content: "", order: 2, status: "skeleton" },
        { id: "approach", title: "Recommended Approach", icon: "route", content: "", order: 3, status: "skeleton" },
        { id: "architecture", title: "Technical Architecture", icon: "server", content: "", order: 4, status: "skeleton" },
        { id: "security", title: "Security & Compliance", icon: "shield", content: "", order: 5, status: "skeleton" },
        { id: "design", title: "Design & User Experience", icon: "palette", content: "", order: 6, status: "skeleton" },
        { id: "risks", title: "Key Risks & Mitigations", icon: "alert-triangle", content: "", order: 7, status: "skeleton" },
        { id: "effort", title: "Estimated Effort & Cost", icon: "dollar-sign", content: "", order: 8, status: "skeleton" },
      ],
    });

    // ── Round 1: Sequential individual assessments ──
    onEvent({ type: "round_start", round: 1 });

    const qaHistory: Array<{ agentName: string; question: string; answer: string }> = [];

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];

      // Signal the card should enter
      onEvent({ type: "agent_enter", persona: persona.id });
      await delay(800);

      // Thinking
      onEvent({ type: "agent_thinking", persona: persona.id });

      const prompt = buildRound1Prompt(idea, i, personas, agentResults, qaHistory);

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

        qaHistory.push({ agentName: persona.name, question, answer: userAnswer });

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

      const specContributions = getSpecContributions(persona.id, agentResults[persona.id]);
      for (const contrib of specContributions) {
      onEvent({
        type: "spec_section",
        id: contrib.id,
        title: contrib.title,
        content: contrib.content,
        order: contrib.order,
        status: "writing",
        round: 1,
      });
      await delay(300);
      onEvent({
        type: "spec_section",
        id: contrib.id,
        title: contrib.title,
        content: contrib.content,
        order: contrib.order,
        status: "complete",
        round: 1,
      });
      }

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

    const synthesisPrompt = `You are the ENMAX Spark Orchestrator. Create a comprehensive, actionable specification document from this team evaluation.

The idea: "${idea}"

Individual assessments:
${round1Summary}

Cross-discussion:
${round2Summary}

Generate a spec document using EXACTLY these markdown headers in this order. Each section must be substantive and actionable.

# Verdict

State the overall recommendation: **Go**, **Go with Conditions**, **Needs More Research**, or **Not Recommended**. Then write a 2-3 sentence executive summary explaining why, in plain language a VP could understand.

# Stakeholder Outreach & Next Steps

This is the most actionable section — write it for a project manager or product owner who needs to know WHO to talk to and WHAT to do next week.

For each department involved, list:
- **Department name** — The specific ENMAX team to engage
- **Recommended contact** — Suggest reaching out to the real counterpart in that department (referencing the role like "Security Analyst in Cybersecurity", "Infrastructure & Platform Lead in Digital Experience", "Solutions Architect in Enterprise Architecture", "UX/UI Designer in Design", "Software Engineer in Engineering"). Write it as "Reach out to the [Role] in [Department]" format.
- **What to discuss** — 1-2 sentences on the specific topics to raise with them
- **Priority** — High / Medium / Low for when to engage them

Then list the **Immediate Actions** (numbered, concrete steps for the next 1-2 weeks):
1. Specific action with owner and timeline
2. etc.

And **Upcoming Milestones** (what should happen in weeks 2-4, 4-8, 8-12).

# Departments Involved

List each department, their role in the project, and key responsibilities. Use a table format:

| Department | Role | Key Responsibilities |
|---|---|---|
| ... | ... | ... |

# Recommended Approach

Detail a phased delivery plan:
- **Phase 1: Discovery & Design** (timeline, deliverables, team)
- **Phase 2: MVP Build** (timeline, deliverables, team)
- **Phase 3: Launch & Iterate** (timeline, deliverables, team)

Include decision gates between phases.

# Technical Architecture

Recommended tech stack, architecture pattern (monolith, microservices, serverless), key Azure services, and integration points. Include:
- Tech stack with justification
- Architecture diagram description
- Key technical challenges and mitigations
- AI/ML components if applicable

# Security & Compliance

Authentication approach, data classification, compliance requirements (NERC CIP, PIPA, SOC 2), specific Azure security services to use, and risk rating with justification.

# Design & User Experience

Key personas, critical user flows, accessibility requirements, recommended design approach, and UI framework. Include specific UX considerations for ENMAX's user base (field workers, business users).

# Key Risks & Mitigations

Top 5 risks in a table:

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | ... | ... | ... | ... |

# Estimated Effort & Cost

Break down by phase:
- Development effort (t-shirt sizing: S/M/L/XL) per phase
- Infrastructure costs (monthly range) per phase
- Licensing implications
- Total estimated range

Be decisive, specific, and actionable throughout. Use concrete numbers, dates, and names of Azure services. Format everything with clean markdown.`;

    const synthesis = await callOpenRouter(
      "You are a strategic technology advisor at ENMAX creating comprehensive, actionable specification documents from expert evaluations. You write for both technical and non-technical stakeholders. Be specific, decisive, and include concrete next steps with real department contacts.",
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

    const parsedSections = parseMarkdownSections(synthesis);
    for (const section of parsedSections) {
      onEvent({
        type: "spec_section",
        id: section.id,
        title: section.title,
        content: section.content,
        order: section.order,
        status: "complete",
      });
      await delay(400);
    }

    onEvent({ type: "round_complete", round: 3 });
    onEvent({ type: "evaluation_complete", status: "complete" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    updateSession.run("error", message, sessionId);
    onEvent({ type: "error", content: message });
  }
}
