import { describe, test, expect } from "bun:test";
import { buildRound1Prompt, personas } from "./agents.js";

describe("buildRound1Prompt", () => {
  const idea = "A mobile app for field workers to report power outages";

  test("first agent gets no prior context", () => {
    const prompt = buildRound1Prompt(idea, 0, personas, {}, []);
    expect(prompt).toContain(idea);
    expect(prompt).toContain(personas[0].role);
    expect(prompt).toContain(personas[0].department);
    expect(prompt).not.toContain("assessments from colleagues");
    expect(prompt).not.toContain("Clarifying questions already asked");
  });

  test("later agent sees prior assessments from earlier agents", () => {
    const agentResults: Record<string, string> = {
      dayee: "Security risk: needs MFA and data classification.",
      nathan: "Recommend Azure App Service with estimated cost of $500/mo.",
    };

    const prompt = buildRound1Prompt(idea, 2, personas, agentResults, []);
    expect(prompt).toContain(idea);
    expect(prompt).toContain("assessments from colleagues");
    expect(prompt).toContain("Security risk: needs MFA and data classification");
    expect(prompt).toContain("$500/mo");
    expect(prompt).not.toContain("Clarifying questions already asked");
  });

  test("later agent sees Q&A history and is told not to repeat", () => {
    const agentResults: Record<string, string> = {
      dayee: "Security assessment here.",
    };
    const qaHistory = [
      {
        agentName: "Dayee",
        question: "What data classification level will this app handle?",
        answer: "It will handle internal-only data, nothing customer-facing.",
      },
    ];

    const prompt = buildRound1Prompt(idea, 1, personas, agentResults, qaHistory);
    expect(prompt).toContain("Clarifying questions already asked and answered");
    expect(prompt).toContain("What data classification level");
    expect(prompt).toContain("internal-only data");
    expect(prompt).toContain("Do NOT repeat points already made");
  });

  test("agent with both prior assessments and Q&A sees both", () => {
    const agentResults: Record<string, string> = {
      dayee: "Dayee's security take.",
      nathan: "Nathan's infra take.",
      dana: "Dana's architecture take.",
    };
    const qaHistory = [
      {
        agentName: "Dayee",
        question: "Will this be public-facing?",
        answer: "No, internal only.",
      },
      {
        agentName: "Nathan",
        question: "How many concurrent users?",
        answer: "About 200 field workers.",
      },
    ];

    const prompt = buildRound1Prompt(idea, 3, personas, agentResults, qaHistory);
    expect(prompt).toContain("assessments from colleagues");
    expect(prompt).toContain("Dayee's security take");
    expect(prompt).toContain("Nathan's infra take");
    expect(prompt).toContain("Dana's architecture take");
    expect(prompt).toContain("Clarifying questions already asked and answered");
    expect(prompt).toContain("Will this be public-facing");
    expect(prompt).toContain("internal only");
    expect(prompt).toContain("How many concurrent users");
    expect(prompt).toContain("200 field workers");
  });

  test("only includes assessments from agents before the current index", () => {
    const agentResults: Record<string, string> = {
      dayee: "Dayee assessment.",
      nathan: "Nathan assessment.",
      dana: "Dana assessment.",
      lalindra: "Lalindra assessment.",
      kyle: "Kyle assessment.",
    };

    const prompt = buildRound1Prompt(idea, 2, personas, agentResults, []);
    expect(prompt).toContain("Dayee assessment");
    expect(prompt).toContain("Nathan assessment");
    expect(prompt).not.toContain("Lalindra assessment");
    expect(prompt).not.toContain("Kyle assessment");
  });

  test("last agent sees all four prior assessments", () => {
    const agentResults: Record<string, string> = {
      dayee: "Dayee's view.",
      nathan: "Nathan's view.",
      dana: "Dana's view.",
      lalindra: "Lalindra's view.",
    };

    const prompt = buildRound1Prompt(idea, 4, personas, agentResults, []);
    expect(prompt).toContain("Dayee");
    expect(prompt).toContain("Nathan");
    expect(prompt).toContain("Dana");
    expect(prompt).toContain("Lalindra");
  });
});
