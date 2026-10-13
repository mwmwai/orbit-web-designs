/**
 * Base agent class for Hermes exec seats.
 * All CEO/CFO/CMO/COO agents extend this.
 */
import OpenAI from "openai";
import { randomUUID } from "node:crypto";

export class Agent {
  constructor({ group, role, name, systemPrompt, model = "openrouter/openrouter/free" }) {
    this.group = group;
    this.role = role;
    this.name = name;
    this.id = randomUUID().slice(0, 8);
    this.model = model;
    this.history = [];
    this.lastOutput = null;
    this.openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || "sk-or-v1" });
    this.systemPrompt = systemPrompt;
  }

  async think(input, options = {}) {
    const messages = [
      { role: "system", content: this.systemPrompt },
      ...this.history.slice(-20),
      { role: "user", content: input }
    ];
    const stream = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
      ...options
    });
    let text = "";
    for await (const chunk of stream) {
      text += chunk.choices[0]?.delta?.content || "";
    }
    this.history.push({ role: "user", content: input });
    this.history.push({ role: "assistant", content: text });
    this.lastOutput = text;
    return text.trim();
  }

  async reset() {
    this.history = [];
    this.lastOutput = null;
  }

  snapshot() {
    return {
      id: this.id,
      group: this.group,
      role: this.role,
      name: this.name,
      memory: this.history,
      lastOutput: this.lastOutput
    };
  }
}

export default Agent;
