import { NextRequest, NextResponse } from "next/server";
import { PositionGroup, Project, RateKey } from "@/lib/types";

const allowedRateKeys: RateKey[] = ["strategy", "concept", "project", "ux", "development", "ai", "prompt", "deployment", "training", "support"];
const allowedUnits = ["Std.", "Pauschal", "Tag", "Monat"] as const;
const allowedStatuses = ["Offen", "Abgestimmt", "Optional", "Zurückgestellt"] as const;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY ist auf dem Server nicht gesetzt." }, { status: 503 });
  }

  const body = (await request.json()) as { project?: Project; prompt?: string };
  if (!body.project || !body.prompt?.trim()) {
    return NextResponse.json({ error: "Projekt und Beschreibung sind erforderlich." }, { status: 400 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: 7000,
      system:
        "Du erstellst professionelle deutsche Leistungsverzeichnisse fuer Software-, KI- und Beratungsangebote. Antworte ausschliesslich mit gueltigem JSON ohne Markdown.",
      messages: [
        {
          role: "user",
          content: buildPrompt(body.project, body.prompt)
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "Anthropic-Anfrage fehlgeschlagen.", detail }, { status: response.status });
  }

  const result = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = result.content?.find((part) => part.type === "text")?.text ?? "";
  const groups = normalizeGroups(parseGroups(text));

  return NextResponse.json({ groups });
}

function buildPrompt(project: Project, userPrompt: string) {
  return `Erstelle ein strukturiertes Leistungsverzeichnis als JSON.

Projekt:
- Name: ${project.projectName}
- Kunde: ${project.client}
- Ansprechpartner: ${project.contactPerson}
- Kurzbeschreibung: ${project.shortDescription}
- Zielsetzung: ${project.objective}
- Technischer Kontext: ${project.technicalContext}
- Module: ${project.modules.join(", ")}
- Kalkulationsart: ${project.calculationType}

Stundensaetze:
${Object.entries(project.rates)
  .map(([key, value]) => `- ${key}: ${value} EUR`)
  .join("\n")}

Anforderung des Nutzers:
${userPrompt}

JSON-Schema:
{
  "groups": [
    {
      "id": "kurzer-id-string",
      "title": "Titel",
      "intro": "kurze Einleitung",
      "active": true,
      "positions": [
        {
          "id": "kurzer-id-string",
          "groupId": "id der gruppe",
          "number": "0.0",
          "title": "Positionstitel",
          "description": "konkrete Leistungsbeschreibung",
          "unit": "Std. | Pauschal | Tag | Monat",
          "quantity": 1,
          "rateKey": "strategy | concept | project | ux | development | ai | prompt | deployment | training | support",
          "unitPrice": 180,
          "category": "Kategorie",
          "required": true,
          "note": "",
          "status": "Offen | Abgestimmt | Optional | Zurueckgestellt",
          "active": true
        }
      ]
    }
  ]
}

Erzeuge 6 bis 10 Hauptgruppen und wirtschaftlich plausible Positionen. Nutze passende Stundensaetze aus den angegebenen Saetzen.`;
}

function parseGroups(text: string): PositionGroup[] {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as { groups?: PositionGroup[] } | PositionGroup[];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.groups)) return parsed.groups;
  throw new Error("Anthropic-Antwort enthaelt keine groups.");
}

function normalizeGroups(groups: PositionGroup[]): PositionGroup[] {
  return groups.map((group, groupIndex) => {
    const groupId = slug(group.id || group.title || `gruppe-${groupIndex + 1}`);
    return {
      id: groupId,
      title: String(group.title || `Leistungsbereich ${groupIndex + 1}`),
      intro: String(group.intro || ""),
      active: group.active !== false,
      positions: (group.positions || []).map((position, positionIndex) => ({
        id: slug(position.id || `${groupId}-${positionIndex + 1}`),
        groupId,
        number: "0.0",
        title: String(position.title || `Position ${positionIndex + 1}`),
        description: String(position.description || ""),
        unit: allowedUnits.includes(position.unit) ? position.unit : "Std.",
        quantity: Number.isFinite(Number(position.quantity)) ? Number(position.quantity) : 1,
        rateKey: allowedRateKeys.includes(position.rateKey) ? position.rateKey : "development",
        unitPrice: Number.isFinite(Number(position.unitPrice)) ? Number(position.unitPrice) : 180,
        category: String(position.category || "KI-generiert"),
        required: Boolean(position.required),
        note: String(position.note || ""),
        status: allowedStatuses.includes(position.status) ? position.status : "Offen",
        active: position.active !== false
      }))
    };
  });
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
