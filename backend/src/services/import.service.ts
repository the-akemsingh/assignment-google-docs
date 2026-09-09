// src/services/import.service.ts
import { supabase } from "../config/supabase";
import { BadRequestError } from "../types/errors";
import MarkdownIt from "markdown-it";

/**
 * Convert plain .txt content into a minimal Tiptap JSON document.
 * Splits on one-or-more blank lines, creates a paragraph per block.
 */
export function parseTxtToTiptapJson(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  const contentBlocks = blocks.length
    ? blocks.map(b => ({ type: "paragraph", content: [{ type: "text", text: b }] }))
    : [{ type: "paragraph", content: [] }];

  return { type: "doc", content: contentBlocks };
}

/**
 * Convert a .md string into Tiptap JSON. Supports headings, paragraphs,
 * bold, italic, bullet and ordered lists. Anything else falls back to a
 * plain paragraph node.
 */
export function parseMarkdownToTiptapJson(markdown: string) {
  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});
  const content: any[] = [];

  // Helper to parse inline tokens into Tiptap text nodes with marks
  const parseInline = (token: any) => {
    if (!token) return [];
    const children = token.children || [];
    const result: any[] = [];
    const markStack: string[] = [];
    for (const child of children) {
      if (!child) continue;
      if (child.type === "text") {
        const node: any = { type: "text", text: child.content };
        if (markStack.length) node.marks = markStack.map(m => ({ type: m }));
        result.push(node);
      } else if (child.type === "strong_open") {
        markStack.push("bold");
      } else if (child.type === "strong_close") {
        const idx = markStack.lastIndexOf("bold");
        if (idx >= 0) markStack.splice(idx, 1);
      } else if (child.type === "em_open") {
        markStack.push("italic");
      } else if (child.type === "em_close") {
        const idx = markStack.lastIndexOf("italic");
        if (idx >= 0) markStack.splice(idx, 1);
      }
    }
    return result;
  };

  const listStack: any[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    switch (token.type) {
      case "heading_open": {
        const level = parseInt(token.tag.slice(1), 10);
        const inline = tokens[i + 1];
        const node = {
          type: "heading",
          attrs: { level },
          content: parseInline(inline),
        };
        content.push(node);
        i += 2; // skip heading_open, inline, heading_close
        break;
      }
      case "paragraph_open": {
        const inline = tokens[i + 1];
        const node = { type: "paragraph", content: parseInline(inline) };
        content.push(node);
        i += 2;
        break;
      }
      case "bullet_list_open": {
        const listNode: any = { type: "bulletList", content: [] };
        listStack.push(listNode);
        break;
      }
      case "ordered_list_open": {
        const listNode: any = { type: "orderedList", content: [] };
        listStack.push(listNode);
        break;
      }
      case "list_item_open": {
        const itemNode: any = { type: "listItem", content: [] };
        i++;
        while (i < tokens.length) {
          const inner = tokens[i];
          if (!inner) {
            i++;
            continue;
          }
          if (inner.type === "list_item_close") {
            i++;
            break;
          }
          if (inner.type === "paragraph_open") {
            // Ensure there is an inline token following
            if (i + 1 >= tokens.length) {
              i++;
              continue;
            }
            const inline = tokens[i + 1];
            const para = { type: "paragraph", content: parseInline(inline) };
            itemNode.content.push(para);
            i += 2; // skip paragraph_open, inline
            // skip paragraph_close
            while (i < tokens.length) {
              const token = tokens[i];
              if (!token) {
                i++;
                continue;
              }
              if (token.type === "paragraph_close") {
                i++;
                break;
              }
              i++;
            }
          }
          i++;
        }
        const curList = listStack[listStack.length - 1];
        if (curList) {
          curList.content.push(itemNode);
        }
        break;
      }
      case "bullet_list_close":
      case "ordered_list_close": {
        const finished = listStack.pop();
        if (!finished) break;
        if (listStack.length === 0) {
          content.push(finished);
        } else {
          const parentList = listStack[listStack.length - 1];
          if (parentList.content.length > 0) {
            const lastItem = parentList.content[parentList.content.length - 1];
            if (lastItem && lastItem.type === "listItem") {
              lastItem.content.push(finished);
            } else {
              parentList.content.push(finished);
            }
          } else {
            parentList.content.push(finished);
          }
        }
        break;
      }
      default:
        break;
    }
  }

  return { type: "doc", content };
}

/** Upload a raw file buffer to Supabase Storage bucket "imports". */
export async function uploadRawFile(userId: string, filename: string, buffer: Buffer) {
  const uuid = crypto.randomUUID();
  const storagePath = `${userId}/${uuid}-${filename}`;
  const { error } = await supabase.storage.from("imports").upload(storagePath, buffer, {
    contentType: "text/plain",
    upsert: false,
  });
  if (error) {
    throw new BadRequestError(`Failed to upload file: ${error.message}`);
  }
  return storagePath;
}

/** Record an import operation in the document_imports table. */
export async function recordImport(
  documentId: string,
  uploadedBy: string,
  originalFileName: string,
  storagePath: string,
  mimeType: string,
  sizeBytes: number
) {
  const { data, error } = await supabase
    .from("document_imports")
    .insert({
      document_id: documentId,
      uploaded_by: uploadedBy,
      original_file_name: originalFileName,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    })
    .single();
  if (error) {
    throw error;
  }
  return data;
}
