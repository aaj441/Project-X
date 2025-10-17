import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { verifyToken } from "../auth/verifyToken";
import { minioClient, minioBaseUrl } from "~/server/minio";
import { checkExportFormatEntitlement, getUserTierLimits } from "~/server/utils/entitlements";

// Simple markdown to HTML converter with accessibility features
function markdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers with proper semantic structure
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');

  // Code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }

  return html;
}

export const createExport = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      projectId: z.number(),
      format: z.enum(["pdf", "epub", "mobi", "html"]),
      templateId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await verifyToken(input.authToken);

    // Verify ownership
    const project = await db.project.findFirst({
      where: {
        id: input.projectId,
        userId,
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    // Check if user's subscription tier allows this export format
    const canExport = await checkExportFormatEntitlement(userId, input.format);
    if (!canExport) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Your subscription tier does not support ${input.format.toUpperCase()} exports. Please upgrade to PRO or ENTERPRISE to access this format.`,
      });
    }

    // Check if watermark should be applied
    const limits = await getUserTierLimits(userId);
    const shouldApplyWatermark = limits.hasWatermark;

    // Get template if specified
    let template = null;
    if (input.templateId) {
      template = await db.template.findUnique({
        where: { id: input.templateId },
      });
    }

    // Generate HTML content
    const htmlContent = generateHTML(project, template, shouldApplyWatermark);

    // Upload to MinIO
    const fileName = `public/exports/${project.id}-${Date.now()}.${input.format === "html" ? "html" : "pdf"}`;
    const buffer = Buffer.from(htmlContent, "utf-8");

    await minioClient.putObject("ebooks", fileName, buffer, buffer.length, {
      "Content-Type": input.format === "html" ? "text/html" : "application/pdf",
    });

    const fileUrl = `${minioBaseUrl}/ebooks/${fileName}`;

    // Create export record
    const exportRecord = await db.export.create({
      data: {
        projectId: input.projectId,
        format: input.format,
        fileUrl,
        status: "completed",
      },
    });

    return exportRecord;
  });

function generateHTML(
  project: any,
  template: any,
  applyWatermark: boolean = false
): string {
  const style = template
    ? JSON.parse(template.styleJson)
    : {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        lineHeight: "1.8",
        maxWidth: "800px",
        textAlign: "justify",
      };

  // Add watermark styles if needed
  const watermarkStyles = applyWatermark ? `
    /* Watermark styles */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 4rem;
      color: rgba(0, 0, 0, 0.05);
      pointer-events: none;
      z-index: 9999;
      white-space: nowrap;
      user-select: none;
    }
    
    @media print {
      .watermark {
        color: rgba(0, 0, 0, 0.08);
      }
    }
  ` : '';

  // Add watermark element if needed
  const watermarkElement = applyWatermark ? `
  <div class="watermark" aria-hidden="true">CREATED WITH PROJECT XAVIER - UPGRADE TO REMOVE</div>
  ` : '';

  // Generate table of contents
  const tocHTML = project.chapters
    .map(
      (chapter: any, index: number) => `
    <li><a href="#chapter-${chapter.id}">${index + 1}. ${chapter.title}</a></li>
  `
    )
    .join("");

  // Generate chapters with semantic HTML and accessibility
  const chaptersHTML = project.chapters
    .map(
      (chapter: any, index: number) => `
    <section id="chapter-${chapter.id}" class="chapter" aria-labelledby="chapter-${chapter.id}-title">
      <h2 id="chapter-${chapter.id}-title">Chapter ${index + 1}: ${chapter.title}</h2>
      <div class="chapter-content">
        ${markdownToHTML(chapter.content)}
      </div>
    </section>
  `
    )
    .join("");

  // Build metadata
  const metadata = {
    title: project.title,
    author: project.authorName || "Unknown Author",
    publisher: project.publisherName || "",
    language: project.language?.toLowerCase() || "en",
    isbn: project.isbn || "",
    description: project.description || "",
    keywords: project.keywords ? JSON.parse(project.keywords).join(", ") : "",
    publicationDate: project.publicationDate
      ? new Date(project.publicationDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  };

  return `<!DOCTYPE html>
<html lang="${metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${metadata.description}">
  <meta name="author" content="${metadata.author}">
  <meta name="keywords" content="${metadata.keywords}">
  <meta name="dcterms.date" content="${metadata.publicationDate}">
  ${metadata.isbn ? `<meta name="dcterms.identifier" content="ISBN:${metadata.isbn}">` : ""}
  
  <!-- Open Graph / Social Media -->
  <meta property="og:type" content="book">
  <meta property="og:title" content="${metadata.title}">
  <meta property="og:description" content="${metadata.description}">
  <meta property="book:author" content="${metadata.author}">
  ${metadata.isbn ? `<meta property="book:isbn" content="${metadata.isbn}">` : ""}
  
  <title>${metadata.title}</title>
  
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      max-width: ${style.maxWidth};
      margin: 0 auto;
      padding: 2rem;
      color: #1a1a1a;
      background: #ffffff;
    }
    
    ${watermarkStyles}
    
    /* Accessibility: Skip to content link */
    .skip-to-content {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    }
    
    .skip-to-content:focus {
      top: 0;
    }
    
    /* Cover page */
    .cover {
      text-align: center;
      padding: 4rem 0;
      page-break-after: always;
    }
    
    .cover-image {
      max-width: 400px;
      height: auto;
      margin-bottom: 2rem;
    }
    
    .cover h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: bold;
    }
    
    .cover .author {
      font-size: 1.5rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .cover .publisher {
      font-size: 1rem;
      color: #999;
    }
    
    /* Copyright page */
    .copyright {
      font-size: 0.9rem;
      color: #666;
      padding: 2rem 0;
      page-break-after: always;
    }
    
    /* Table of contents */
    .toc {
      page-break-after: always;
      padding: 2rem 0;
    }
    
    .toc h2 {
      font-size: 2rem;
      margin-bottom: 2rem;
    }
    
    .toc ul {
      list-style: none;
      padding: 0;
    }
    
    .toc li {
      margin-bottom: 0.75rem;
      line-height: 1.6;
    }
    
    .toc a {
      color: #333;
      text-decoration: none;
      border-bottom: 1px dotted #999;
    }
    
    .toc a:hover {
      color: #000;
      border-bottom-color: #000;
    }
    
    /* Chapter styles */
    .chapter {
      margin-bottom: 4rem;
      page-break-before: always;
    }
    
    .chapter h2 {
      font-size: 2rem;
      margin-bottom: 2rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .chapter-content {
      text-align: ${style.textAlign || "justify"};
    }
    
    .chapter-content p {
      margin-bottom: 1.2rem;
    }
    
    .chapter-content h1 {
      font-size: 2rem;
      margin: 2rem 0 1rem;
    }
    
    .chapter-content h2 {
      font-size: 1.5rem;
      margin: 1.5rem 0 0.75rem;
    }
    
    .chapter-content h3 {
      font-size: 1.25rem;
      margin: 1.25rem 0 0.5rem;
    }
    
    .chapter-content ul,
    .chapter-content ol {
      margin: 1rem 0 1rem 2rem;
    }
    
    .chapter-content li {
      margin-bottom: 0.5rem;
    }
    
    .chapter-content blockquote {
      margin: 1.5rem 2rem;
      padding: 1rem;
      background: #f5f5f5;
      border-left: 4px solid #666;
      font-style: italic;
    }
    
    .chapter-content code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    .chapter-content pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    .chapter-content pre code {
      background: none;
      padding: 0;
    }
    
    .chapter-content strong {
      font-weight: bold;
    }
    
    .chapter-content em {
      font-style: italic;
    }
    
    .chapter-content a {
      color: #0066cc;
      text-decoration: underline;
    }
    
    /* Print styles */
    @media print {
      body {
        font-size: 12pt;
        line-height: 1.6;
      }
      
      .chapter {
        page-break-before: always;
      }
      
      a {
        color: #000;
        text-decoration: none;
      }
      
      .toc a::after {
        content: leader('.') target-counter(attr(href), page);
      }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      body {
        background: #000;
        color: #fff;
      }
      
      .chapter h2 {
        border-bottom-color: #fff;
      }
      
      .chapter-content blockquote {
        background: #333;
        border-left-color: #fff;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
      }
    }
  </style>
</head>
<body>
  ${watermarkElement}
  <a href="#main-content" class="skip-to-content">Skip to main content</a>
  
  <!-- Cover Page -->
  <section class="cover" role="doc-cover">
    ${
      project.coverImage
        ? `<img src="${project.coverImage}" alt="Cover image for ${metadata.title}" class="cover-image">`
        : ""
    }
    <h1>${metadata.title}</h1>
    ${metadata.author ? `<p class="author">by ${metadata.author}</p>` : ""}
    ${metadata.publisher ? `<p class="publisher">${metadata.publisher}</p>` : ""}
  </section>
  
  <!-- Copyright Page -->
  <section class="copyright" role="doc-copyright">
    <p><strong>${metadata.title}</strong></p>
    ${metadata.author ? `<p>Copyright © ${new Date().getFullYear()} ${metadata.author}</p>` : ""}
    <p>Published: ${metadata.publicationDate}</p>
    ${metadata.isbn ? `<p>ISBN: ${metadata.isbn}</p>` : ""}
    ${metadata.publisher ? `<p>Publisher: ${metadata.publisher}</p>` : ""}
    <br>
    <p>All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher.</p>
  </section>
  
  <!-- Table of Contents -->
  <nav class="toc" role="doc-toc" aria-label="Table of Contents">
    <h2>Table of Contents</h2>
    <ul>
      ${tocHTML}
    </ul>
  </nav>
  
  <!-- Main Content -->
  <main id="main-content" role="main">
    ${chaptersHTML}
  </main>
  
  <!-- Back Matter -->
  <section class="back-matter" role="doc-backmatter">
    <hr style="margin: 3rem 0;">
    <p style="text-align: center; font-style: italic;">
      ${metadata.author ? `Thank you for reading ${metadata.title} by ${metadata.author}.` : `Thank you for reading ${metadata.title}.`}
    </p>
  </section>
</body>
</html>`;
}
