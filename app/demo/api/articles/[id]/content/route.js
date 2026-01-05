import { NextResponse } from "next/server";

// Demo API route for article content - uses localStorage simulation via in-memory storage
// In a real implementation, this would use a database

// In-memory storage for demo (in production, this would be a database)
const contentStorage = new Map();

// Helper to get storage key
function getStorageKey(articleId) {
  return `demo-article-content-${articleId}`;
}

// GET - Fetch article content
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // In a real app, this would fetch from database
    // For demo, we'll return mock content or empty
    const storageKey = getStorageKey(id);
    
    // Try to get from in-memory storage first
    let content = contentStorage.get(storageKey);
    
    // If not in memory, return default content
    if (!content) {
      content = {
        contentJson: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Start writing your article..." }],
            },
            {
              type: "paragraph",
              content: [],
            },
          ],
        },
        content: "<h1>Start writing your article...</h1><p></p>",
        contentMarkdown: "Start writing your article...\n",
      };
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error("Error fetching article content:", error);
    return NextResponse.json(
      { error: "Failed to fetch article content" },
      { status: 500 }
    );
  }
}

// PUT - Save article content
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { contentJson, content, contentMarkdown } = body;
    
    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = contentMarkdown
      ? contentMarkdown.trim().split(/\s+/).filter(word => word.length > 0).length
      : 0;
    const readTimeMinutes = Math.ceil(wordCount / 200);
    const readTime = readTimeMinutes > 0 ? `${readTimeMinutes} min read` : null;
    
    // Store in memory (in production, this would save to database)
    const storageKey = getStorageKey(id);
    contentStorage.set(storageKey, {
      contentJson: contentJson || null,
      content: content || "",
      contentMarkdown: contentMarkdown || "",
    });
    
    return NextResponse.json({
      message: "Content saved successfully",
      readTime,
    });
  } catch (error) {
    console.error("Error saving article content:", error);
    return NextResponse.json(
      { error: "Failed to save article content" },
      { status: 500 }
    );
  }
}

