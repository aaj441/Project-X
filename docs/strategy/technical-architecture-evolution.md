# Technical Architecture Evolution for Blue Ocean Strategy

This document outlines the technical changes needed to support the Blue Ocean Strategy roadmap.

---

## Current Architecture Overview

### Technology Stack
- **Frontend:** React + TanStack Router + Tailwind CSS
- **Backend:** Node.js + tRPC + Prisma ORM
- **Database:** PostgreSQL
- **Storage:** MinIO (S3-compatible)
- **AI:** OpenRouter API
- **Payments:** Stripe

### Current Capabilities
- RESTful-style tRPC API
- JWT authentication
- File storage for cover images
- Subscription management
- AI credit system

---

## Phase 1: Foundation Enhancements

### Database Schema Changes

```prisma
// Enhanced AI capabilities
model AISession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id])
  chapterId   String?
  chapter     Chapter? @relation(fields: [chapterId], references: [id])
  type        String   // "rewrite", "expand", "suggest", "cowrite"
  context     Json     // conversation history, settings
  creditsUsed Int
  createdAt   DateTime @default(now())
}

// Template improvements
model Template {
  // ... existing fields
  category    String?  // "fiction", "non-fiction", "academic", etc.
  difficulty  String?  // "beginner", "intermediate", "advanced"
  preview     String?  // URL to preview image
  popularity  Int      @default(0)
  aiGenerated Boolean  @default(false)
}

// Marketing intelligence
model MarketingInsight {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  type        String   // "keyword", "category", "trend", "competitor"
  data        Json
  confidence  Float
  createdAt   DateTime @default(now())
}

// Onboarding tracking
model UserOnboarding {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  completedSteps  Json     // array of completed step IDs
  currentStep     String?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### New tRPC Procedures
- `ai.startCowritingSession` - Initialize interactive AI session
- `ai.continueCowriting` - Stream AI responses in conversation
- `ai.rewriteSelection` - Inline text rewriting
- `ai.expandSelection` - Expand selected text
- `marketing.analyzeKeywords` - Keyword trend analysis
- `marketing.suggestCategories` - Category recommendations
- `marketing.getCompetitorInsights` - Competitive analysis
- `templates.getRecommendations` - AI-powered template suggestions
- `onboarding.getProgress` - Get user onboarding state
- `onboarding.completeStep` - Mark onboarding step complete

### Frontend Components
- `AICowritingPanel` - Interactive AI editing sidebar
- `OnboardingTour` - Step-by-step guided tour
- `TemplateRecommendations` - Smart template picker
- `MarketingInsightsPanel` - Analytics dashboard
- `InlineAIMenu` - Context menu for text selection

---

## Phase 2: Community & Collaboration

### Database Schema Changes

```prisma
// Author profiles
model AuthorProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  displayName String
  bio         String?
  avatar      String?
  website     String?
  social      Json?    // social media links
  genres      String[] // preferred genres
  public      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Project sharing
model ProjectShare {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  shareType   String   // "public", "unlisted", "beta"
  accessCode  String?  @unique
  allowComments Boolean @default(true)
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
}

// Beta readers
model BetaReader {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  email       String?  // for non-registered readers
  name        String
  genres      String[]
  experience  String   // "beginner", "intermediate", "expert"
  availability String  // "high", "medium", "low"
  rating      Float?
  reviewCount Int      @default(0)
  createdAt   DateTime @default(now())
}

model BetaReadingRequest {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  readerId    String
  reader      BetaReader @relation(fields: [readerId], references: [id])
  status      String   // "pending", "accepted", "completed", "declined"
  deadline    DateTime?
  feedback    Json?
  rating      Int?
  createdAt   DateTime @default(now())
  completedAt DateTime?
}

// Enhanced comments for collaboration
model Comment {
  // ... existing fields
  parentId    String?
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  resolved    Boolean   @default(false)
  type        String    @default("comment") // "comment", "suggestion", "question"
  selection   Json?     // text selection range
}

// Author groups/communities
model AuthorGroup {
  id          String   @id @default(cuid())
  name        String
  description String?
  genre       String?
  isPublic    Boolean  @default(true)
  createdBy   String
  creator     User     @relation(fields: [createdBy], references: [id])
  members     AuthorGroupMember[]
  createdAt   DateTime @default(now())
}

model AuthorGroupMember {
  id        String   @id @default(cuid())
  groupId   String
  group     AuthorGroup @relation(fields: [groupId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      String   @default("member") // "admin", "moderator", "member"
  joinedAt  DateTime @default(now())
  
  @@unique([groupId, userId])
}

// Gamification
model Achievement {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  description String
  icon        String
  category    String   // "writing", "community", "publishing", "marketing"
  points      Int
  rarity      String   // "common", "uncommon", "rare", "epic", "legendary"
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  achievementId String
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  unlockedAt    DateTime @default(now())
  
  @@unique([userId, achievementId])
}

model UserStats {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  level           Int      @default(1)
  xp              Int      @default(0)
  wordsWritten    Int      @default(0)
  chaptersCompleted Int    @default(0)
  booksPublished  Int      @default(0)
  streak          Int      @default(0)
  lastActiveDate  DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Real-Time Features
- WebSocket support for collaborative editing
- Live cursor positions and selections
- Real-time comment notifications
- Presence indicators (who's viewing/editing)

### New tRPC Procedures
- `profiles.create/update/get` - Author profile management
- `sharing.createShare` - Share project publicly or with beta readers
- `betaReaders.find/invite/manage` - Beta reader system
- `comments.createThread/reply/resolve` - Enhanced commenting
- `groups.create/join/leave/list` - Community groups
- `achievements.list/unlock` - Gamification
- `stats.get/update` - User statistics

### Infrastructure Needs
- WebSocket server for real-time features
- Notification system (email + in-app)
- Search indexing for author/project discovery

---

## Phase 3: Advanced Publishing & Distribution

### Database Schema Changes

```prisma
// Author storefronts
model AuthorStorefront {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  slug        String   @unique
  customDomain String? @unique
  theme       Json     // color scheme, layout preferences
  about       String?
  featured    String[] // project IDs
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Reader accounts
model Reader {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  passwordHash String
  library     ReaderLibrary[]
  purchases   Purchase[]
  subscriptions ReaderSubscription[]
  createdAt   DateTime @default(now())
}

model ReaderLibrary {
  id        String   @id @default(cuid())
  readerId  String
  reader    Reader   @relation(fields: [readerId], references: [id])
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  progress  Json?    // reading progress, bookmarks
  addedAt   DateTime @default(now())
  lastRead  DateTime?
  
  @@unique([readerId, projectId])
}

// Direct sales
model Purchase {
  id          String   @id @default(cuid())
  readerId    String
  reader      Reader   @relation(fields: [readerId], references: [id])
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  amount      Int      // in cents
  currency    String   @default("usd")
  paymentMethod String
  stripePaymentId String?
  status      String   // "pending", "completed", "refunded"
  metadata    Json?
  createdAt   DateTime @default(now())
}

// Flexible pricing
model ProjectPricing {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id])
  model       String   // "fixed", "pwyw", "free", "subscription", "chapter"
  basePrice   Int?     // in cents
  minPrice    Int?     // for PWYW
  suggestedPrice Int?  // for PWYW
  chapterPrices Json?  // for per-chapter pricing
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Multimedia assets
model MediaAsset {
  id          String   @id @default(cuid())
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id])
  chapterId   String?
  chapter     Chapter? @relation(fields: [chapterId], references: [id])
  type        String   // "audio", "video", "image", "interactive"
  filename    String
  mimeType    String
  size        Int
  duration    Int?     // for audio/video in seconds
  url         String
  thumbnail   String?
  metadata    Json?
  createdAt   DateTime @default(now())
}

// Enhanced chapters for multimedia
model Chapter {
  // ... existing fields
  contentType String   @default("markdown") // "markdown", "rich", "multimedia"
  mediaAssets MediaAsset[]
  interactive Json?    // interactive elements config
}

// Distribution tracking
model Distribution {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  platform    String   // "kdp", "apple", "kobo", "direct", etc.
  status      String   // "draft", "submitted", "published", "error"
  externalId  String?  // platform-specific ID
  url         String?
  metadata    Json?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Infrastructure Requirements
- **Payment Processing:** Stripe Connect for author payouts
- **CDN:** CloudFront or similar for multimedia delivery
- **Storage:** Expanded MinIO with multiple buckets (audio, video, images)
- **Encoding:** Video transcoding service (e.g., AWS MediaConvert)
- **Email:** Transactional email service (SendGrid, Postmark)
- **Domain Management:** Custom domain DNS configuration

### New tRPC Procedures
- `storefront.create/update/get` - Storefront management
- `readers.register/login/library` - Reader account system
- `sales.purchase/refund/list` - Direct sales
- `pricing.set/get` - Flexible pricing models
- `media.upload/delete/list` - Multimedia management
- `distribution.publish/update/track` - Multi-platform publishing

### Security Considerations
- PCI compliance for payment processing
- DRM considerations for content protection
- Rate limiting for public-facing APIs
- CORS configuration for custom domains

---

## Phase 4: Dynamic Content & Ecosystems

### Database Schema Changes

```prisma
// Reader subscriptions to authors
model ReaderSubscription {
  id          String   @id @default(cuid())
  readerId    String
  reader      Reader   @relation(fields: [readerId], references: [id])
  authorId    String
  author      User     @relation("AuthorSubscriptions", fields: [authorId], references: [id])
  tier        String   // "basic", "premium", "vip"
  amount      Int      // monthly amount in cents
  status      String   // "active", "paused", "cancelled"
  stripeSubscriptionId String?
  currentPeriodEnd DateTime
  createdAt   DateTime @default(now())
  cancelledAt DateTime?
}

// Dynamic content variations
model ContentVariation {
  id          String   @id @default(cuid())
  chapterId   String
  chapter     Chapter  @relation(fields: [chapterId], references: [id])
  variant     String   // "simple", "standard", "advanced", "technical", etc.
  content     String
  metadata    Json?    // reading level, tone, etc.
  createdAt   DateTime @default(now())
}

// Reader preferences
model ReaderPreference {
  id          String   @id @default(cuid())
  readerId    String   @unique
  reader      Reader   @relation(fields: [readerId], references: [id])
  readingLevel String  @default("standard")
  preferredTone String @default("neutral")
  fontSize    Int      @default(16)
  theme       String   @default("light")
  preferences Json?    // additional customizations
  updatedAt   DateTime @updatedAt
}

// Interactive story paths
model StoryPath {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  fromChapterId String
  fromChapter Chapter  @relation("PathFrom", fields: [fromChapterId], references: [id])
  toChapterId String
  toChapter   Chapter  @relation("PathTo", fields: [toChapterId], references: [id])
  condition   Json?    // decision point, requirement
  label       String?  // choice text
  order       Int      @default(0)
}

// Reading analytics
model ReadingSession {
  id          String   @id @default(cuid())
  readerId    String
  reader      Reader   @relation(fields: [readerId], references: [id])
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  chapterId   String?
  chapter     Chapter? @relation(fields: [chapterId], references: [id])
  duration    Int      // seconds
  completed   Boolean  @default(false)
  interactions Json?   // clicks, choices, annotations
  startedAt   DateTime @default(now())
  endedAt     DateTime?
}

// Content A/B testing
model ContentExperiment {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  name        String
  variants    Json     // array of variant configurations
  metrics     Json?    // engagement, completion, etc.
  status      String   // "draft", "running", "completed"
  startedAt   DateTime?
  endedAt     DateTime?
  createdAt   DateTime @default(now())
}

// Advanced AI context
model AIKnowledgeBase {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id])
  characters  Json     // character profiles, relationships
  worldBuilding Json   // settings, rules, history
  plotPoints  Json     // story structure, arcs
  style       Json     // voice, tone, patterns
  facts       Json     // researched information, citations
  updatedAt   DateTime @updatedAt
}
```

### Advanced Infrastructure
- **Personalization Engine:** ML models for content adaptation
- **Analytics Platform:** Time-series database for reading analytics
- **Real-time Processing:** Stream processing for live content adaptation
- **ML Infrastructure:** Model training and serving (potentially custom)
- **Graph Database:** Optional, for complex story path relationships

### New tRPC Procedures
- `subscriptions.create/cancel/manage` - Reader subscriptions
- `content.generateVariations` - Create adaptive content
- `content.getOptimalVariation` - Select best variation for reader
- `paths.create/update/list` - Interactive story management
- `analytics.track/query` - Reading analytics
- `experiments.create/run/analyze` - A/B testing
- `ai.updateKnowledgeBase` - Manage AI context
- `ai.advancedCowrite` - Multi-turn collaborative creation

### Performance Considerations
- Content variation caching strategy
- Pre-generation vs. on-demand adaptation
- CDN edge computing for personalization
- Database query optimization for analytics
- Async processing for ML operations

---

## Migration Strategy

### Backward Compatibility
- All schema changes use optional fields initially
- Feature flags for gradual rollout
- Dual-write periods for major changes
- Comprehensive migration scripts

### Data Migration Steps
1. Add new tables/columns
2. Backfill existing data where needed
3. Deploy application code with feature flags off
4. Enable features gradually
5. Monitor performance and errors
6. Remove old code/columns after stabilization

### Testing Strategy
- Unit tests for all new procedures
- Integration tests for complex workflows
- Load testing for real-time features
- Security audits for payment/auth changes
- User acceptance testing for major features

---

## Monitoring & Observability

### Key Metrics to Track
- **Performance:** API response times, database query performance
- **Usage:** Feature adoption, user engagement, content creation
- **Business:** Revenue, conversions, churn, CAC/LTV
- **Technical:** Error rates, uptime, storage usage, AI costs

### Logging & Alerting
- Structured logging for all operations
- Error tracking and alerting (Sentry, etc.)
- Performance monitoring (New Relic, Datadog, etc.)
- Custom dashboards for business metrics

---

## Security & Compliance

### Phase-Specific Considerations
- **Phase 1:** Enhanced AI usage tracking for billing
- **Phase 2:** User-generated content moderation
- **Phase 3:** PCI-DSS compliance, DMCA procedures
- **Phase 4:** Data privacy for personalization, GDPR compliance

### Ongoing Requirements
- Regular security audits
- Penetration testing
- Dependency updates
- Access control reviews
- Data backup and recovery procedures

---

## Cost Projections

### Infrastructure Costs by Phase
- **Phase 1:** +20% (enhanced AI usage)
- **Phase 2:** +50% (WebSockets, notifications, search)
- **Phase 3:** +200% (CDN, storage, payment processing)
- **Phase 4:** +300% (ML infrastructure, analytics, personalization)

### Optimization Strategies
- Efficient AI prompt engineering
- Content caching and CDN usage
- Database query optimization
- Serverless for variable workloads
- Reserved instances for predictable loads

---

## Next Steps for Engineering

1. **Review and validate** technical approach with team
2. **Set up development environment** for Phase 1 features
3. **Create detailed technical specs** for P1.1 (AI Co-writing)
4. **Establish CI/CD pipelines** for safe deployments
5. **Implement monitoring** before adding complexity
6. **Begin Phase 1 implementation** with small, iterative releases
