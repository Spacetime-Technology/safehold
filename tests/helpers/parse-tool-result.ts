type TextContent = { type: 'text'; text: string };

export function parseToolResult(content: unknown): Record<string, unknown> {
  const items = content as TextContent[];
  return JSON.parse(items[0]!.text) as Record<string, unknown>;
}
