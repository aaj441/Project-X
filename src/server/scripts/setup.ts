import { minioClient } from "~/server/minio";
import { db } from "~/server/db";

async function setup() {
  // Set up MinIO buckets
  const bucketName = "ebooks";
  const bucketExists = await minioClient.bucketExists(bucketName);
  
  if (!bucketExists) {
    await minioClient.makeBucket(bucketName);
    console.log(`Created bucket: ${bucketName}`);
    
    // Set bucket policy to allow public read access for files with "public/" prefix
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/public/*`],
        },
      ],
    };
    
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`Set public policy for bucket: ${bucketName}`);
  }
  
  // Set up cover images bucket
  const coverBucketName = "cover-images";
  const coverBucketExists = await minioClient.bucketExists(coverBucketName);
  
  if (!coverBucketExists) {
    await minioClient.makeBucket(coverBucketName);
    console.log(`Created bucket: ${coverBucketName}`);
    
    // Set bucket policy to allow public read access for all files
    const coverPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${coverBucketName}/*`],
        },
      ],
    };
    
    await minioClient.setBucketPolicy(coverBucketName, JSON.stringify(coverPolicy));
    console.log(`Set public policy for bucket: ${coverBucketName}`);
  }
  
  // Seed templates if they don't exist
  const templateCount = await db.template.count();
  if (templateCount === 0) {
    await db.template.createMany({
      data: [
        {
          name: "Modern Fiction",
          description: "Clean, contemporary design perfect for novels and fiction",
          category: "fiction",
          styleJson: JSON.stringify({
            fontFamily: "Georgia, serif",
            fontSize: "16px",
            lineHeight: "1.8",
            chapterTitleSize: "32px",
            margins: { top: "2in", bottom: "2in", left: "1.5in", right: "1.5in" },
          }),
          previewUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
        },
        {
          name: "Academic",
          description: "Professional layout for academic papers and research",
          category: "academic",
          styleJson: JSON.stringify({
            fontFamily: "Times New Roman, serif",
            fontSize: "12px",
            lineHeight: "2.0",
            chapterTitleSize: "18px",
            margins: { top: "1in", bottom: "1in", left: "1in", right: "1in" },
          }),
          previewUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
        },
        {
          name: "Minimalist",
          description: "Simple, elegant design with plenty of white space",
          category: "non-fiction",
          styleJson: JSON.stringify({
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
            chapterTitleSize: "28px",
            margins: { top: "1.5in", bottom: "1.5in", left: "1in", right: "1in" },
          }),
          previewUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        },
        {
          name: "Classic Literature",
          description: "Traditional styling reminiscent of classic books",
          category: "fiction",
          styleJson: JSON.stringify({
            fontFamily: "Garamond, serif",
            fontSize: "15px",
            lineHeight: "1.9",
            chapterTitleSize: "30px",
            margins: { top: "2.5in", bottom: "2.5in", left: "2in", right: "2in" },
          }),
          previewUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        },
      ],
    });
    console.log("Seeded templates");
  }
  
  // Seed agents if they don't exist
  const agentCount = await db.agent.count();
  if (agentCount === 0) {
    await db.agent.createMany({
      data: [
        {
          name: "ContentCraft AI",
          type: "content",
          description: "Expert in creating engaging written content, from blog posts to ebooks",
          capabilities: JSON.stringify([
            "Content generation",
            "SEO optimization",
            "Tone adaptation",
            "Multi-language support",
          ]),
          status: "active",
        },
        {
          name: "DataViz Pro",
          type: "analytics",
          description: "Transforms raw data into actionable insights and beautiful visualizations",
          capabilities: JSON.stringify([
            "Data analysis",
            "Chart generation",
            "Trend identification",
            "Report creation",
          ]),
          status: "active",
        },
        {
          name: "TalentSync",
          type: "hr",
          description: "Streamlines HR processes and employee management workflows",
          capabilities: JSON.stringify([
            "Candidate screening",
            "Performance reviews",
            "Onboarding automation",
            "Policy documentation",
          ]),
          status: "active",
        },
        {
          name: "DesignMaster",
          type: "design",
          description: "Creates stunning visual designs and maintains design systems",
          capabilities: JSON.stringify([
            "UI/UX design",
            "Brand consistency",
            "Asset generation",
            "Design system management",
          ]),
          status: "active",
        },
        {
          name: "FinanceBot",
          type: "finance",
          description: "Automates financial reporting and budget management",
          capabilities: JSON.stringify([
            "Budget tracking",
            "Financial forecasting",
            "Expense reporting",
            "Invoice processing",
          ]),
          status: "active",
        },
        {
          name: "LearnHub AI",
          type: "learning",
          description: "Develops educational content and training materials",
          capabilities: JSON.stringify([
            "Course creation",
            "Assessment design",
            "Learning path optimization",
            "Knowledge base management",
          ]),
          status: "active",
        },
        {
          name: "AutoFlow",
          type: "automation",
          description: "Orchestrates complex workflows and automates repetitive tasks",
          capabilities: JSON.stringify([
            "Workflow automation",
            "Task scheduling",
            "Integration management",
            "Process optimization",
          ]),
          status: "active",
        },
      ],
    });
    console.log("Seeded agents");
  }
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
