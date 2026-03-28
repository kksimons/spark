# ENMAX Spark — Idea Evaluator

An interactive AI-powered idea evaluation tool for ENMAX. Submit a product idea, AI use case, or app concept and watch a panel of department specialists evaluate it from every angle.

## Personas

| Name | Department | Focus |
|------|-----------|-------|
| **Dayee** | Cybersecurity | Azure security, Entra ID, compliance, threat modeling |
| **Nathan** | Digital Experience | Infrastructure, cloud costs, accessibility, deployment |
| **Dana** | Enterprise Architecture | Microsoft ecosystem fit, build vs. buy, integration |
| **Lalindra** | Design | UX/UI, accessibility, user flows, design systems |
| **Kyle** | Engineering | Tech stack, architecture, AI/ML, development effort |

## How It Works

1. You describe your idea in the chat input
2. **Round 1** — Each specialist independently evaluates the idea
3. **Round 2** — Specialists review each other's assessments and discuss cross-cutting concerns
4. **Round 3** — An orchestrator synthesizes everything into a final action plan

## Setup

```bash
git clone https://github.com/kksimons/enmax-spark.git
cd enmax-spark
npm install
cp .env.example .env
# Add your OpenRouter API key to .env
npm run dev
```

Open http://localhost:3000

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, shadcn-style components
- **Backend**: Express, better-sqlite3
- **AI**: OpenRouter API (Gemini 2.5 Flash)
- **Design**: Black & white, minimal, conference badge-style persona cards

## Environment Variables

| Variable | Description |
|----------|------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
