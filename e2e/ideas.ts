export interface TestIdea {
  name: string;
  idea: string;
  expectedKeywords: string[];
  expectedDepartments: string[];
  answer?: string;
}

export const TEST_IDEAS: TestIdea[] = [
  {
    name: "team-capacity-dashboard",
    idea:
      "I want to create a dashboard that exposes my team's capacity to the rest of the organization so they can see what we're working on, the release schedule, when they'd be able to schedule us for more work at the soonest, etc.",
    expectedKeywords: ["dashboard", "capacity", "Azure", "Power BI", "kanban"],
    expectedDepartments: ["Digital Experience", "Engineering", "Design"],
    answer:
      "The core data comes from our Azure DevOps kanban boards — sprint capacity, story points, release train schedules. It'd pipe into Power BI for the executive view with real-time sync.",
  },
  {
    name: "ai-outage-predictor",
    idea:
      "An AI-powered tool that analyzes historical outage data and weather patterns to predict power outages before they happen, so we can pre-position crews and reduce response time.",
    expectedKeywords: ["AI", "outage", "predict", "Azure", "ML"],
    expectedDepartments: ["Cybersecurity", "Engineering", "Enterprise Architecture"],
    answer:
      "We have about 5 years of outage data in our data lake, plus access to Environment Canada weather APIs. The prediction model would need to integrate with our existing dispatch system.",
  },
  {
    name: "customer-solar-portal",
    idea:
      "A self-service web portal for customers to manage their solar panel installation, track energy production, see credits on their bill, and request maintenance.",
    expectedKeywords: ["portal", "solar", "customer", "self-service"],
    expectedDepartments: ["Design", "Digital Experience", "Cybersecurity"],
    answer:
      "This would be public-facing for residential and commercial customers who have or are considering solar installations through ENMAX Energy.",
  },
  {
    name: "internal-knowledge-chatbot",
    idea:
      "A Microsoft Teams chatbot that lets employees ask questions about company policies, IT support, HR benefits, and facility information using natural language. It should learn from our internal SharePoint and Confluence wikis.",
    expectedKeywords: ["chatbot", "Teams", "knowledge", "AI", "SharePoint"],
    expectedDepartments: ["Enterprise Architecture", "Engineering", "Cybersecurity"],
  },
  {
    name: "ev-charging-optimizer",
    idea:
      "A mobile app that helps EV owners find the nearest ENMAX charging station, reserve a charger, see real-time availability, and get smart charging recommendations based on grid demand and pricing.",
    expectedKeywords: ["mobile", "EV", "charging", "real-time", "grid"],
    expectedDepartments: ["Design", "Engineering", "Digital Experience"],
    answer:
      "We currently have 200+ Level 2 and DC fast chargers across Calgary. The app would use IoT sensors on each charger for live status and integrate with our billing system.",
  },
];
