import { DemoWriteArticleClient } from "./demo-write-article-client";

// Force dynamic rendering to avoid prerender issues with client-side localStorage
export const dynamic = 'force-dynamic';

export default function DemoWriteArticlePage() {
    return <DemoWriteArticleClient />;
}
