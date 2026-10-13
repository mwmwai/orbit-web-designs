# Hermes Exec System

Autonomous executive agent system for Orbit Web Designs running CEO, CFO, CMO, COO seats in parallel with shared memory.

## Architecture

- **CEO-Strategy**: Market positioning, growth vision, competitive strategy
- **CFO-Finance**: Financial modeling, pricing optimization, revenue risk
- **CMO-Marketing**: Growth channels, lead generation, conversion optimization
- **COO-Operations**: Delivery pipeline, execution quality, team coordination

## How it Works

1. Each agent receives a brief with context, constraint, and definition of done
2. Agents run in parallel (not sequentially)
3. Results are merged into one coherent executive brief
4. Outputs are logged to shared memory (MEMORY.md) for continuity
5. System follows the Boss framework: Clarify → Organize → Mobilize → Merge → Audit → Notify → Drive

## Quick Start

```powershell
# Windows PowerShell
.\start.ps1
```

```bash
# Unix/Linux/macOS
./run_hermes.sh
```

## Memory System

- Shared memory: `src/memory/MEMORY.md`
- Session logs: `src/memory/merged-outputs.log`
- Agents inject relevant memory into their briefs
- After each session, durable insights are harvested back to memory

## Agent Seats

Each seat extends the base `Agent` class with specialized system prompts and domain-specific analysis methods.

The system is designed to run autonomously, providing strategic, financial, marketing, and operational insights for Orbit Web Designs in the Nairobi SMB market.