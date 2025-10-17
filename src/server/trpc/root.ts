import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";

// Auth procedures
import { signup } from "~/server/trpc/procedures/auth/signup";
import { login } from "~/server/trpc/procedures/auth/login";

// Project procedures
import { listProjects } from "~/server/trpc/procedures/projects/listProjects";
import { createProject } from "~/server/trpc/procedures/projects/createProject";
import { getProject } from "~/server/trpc/procedures/projects/getProject";
import { updateProject } from "~/server/trpc/procedures/projects/updateProject";
import { deleteProject } from "~/server/trpc/procedures/projects/deleteProject";

// Chapter procedures
import { createChapter } from "~/server/trpc/procedures/chapters/createChapter";
import { updateChapter } from "~/server/trpc/procedures/chapters/updateChapter";
import { deleteChapter } from "~/server/trpc/procedures/chapters/deleteChapter";

// Agent procedures
import { listAgents } from "~/server/trpc/procedures/agents/listAgents";
import { assignAgent } from "~/server/trpc/procedures/agents/assignAgent";

// User procedures
import { getUserProfile } from "~/server/trpc/procedures/users/getUserProfile";
import { updateUserProfile } from "~/server/trpc/procedures/users/updateUserProfile";

// Module procedures
import { getModuleStats } from "~/server/trpc/procedures/modules/getModuleStats";

// AI procedures
import { generateChapter } from "~/server/trpc/procedures/ai/generateChapter";
import { analyzeVoice } from "~/server/trpc/procedures/ai/analyzeVoice";
import { generateOutline } from "~/server/trpc/procedures/ai/generateOutline";
import { checkConsistency } from "~/server/trpc/procedures/ai/checkConsistency";
import { calculateReadability } from "~/server/trpc/procedures/ai/calculateReadability";
import { generateMarketing } from "~/server/trpc/procedures/ai/generateMarketing";
import { getSuggestionsStream } from "~/server/trpc/procedures/ai/getSuggestionsStream";
import { rewriteTextStream } from "~/server/trpc/procedures/ai/rewriteTextStream";
import { expandTextStream } from "~/server/trpc/procedures/ai/expandTextStream";
import { generateKeywords } from "~/server/trpc/procedures/ai/generateKeywords";
import { suggestTitles } from "~/server/trpc/procedures/ai/suggestTitles";
import { suggestMetadata } from "~/server/trpc/procedures/ai/suggestMetadata";
import { generateBlurb } from "~/server/trpc/procedures/ai/generateBlurb";
import { getEncouragement } from "~/server/trpc/procedures/ai/adhd/getEncouragement";
import { analyzeRoadblock } from "~/server/trpc/procedures/ai/adhd/analyzeRoadblock";
import { processIdeaPot } from "~/server/trpc/procedures/ai/brainstorm/processIdeaPot";

// Template procedures
import { listTemplates } from "~/server/trpc/procedures/templates/listTemplates";

// Export procedures
import { createExport } from "~/server/trpc/procedures/exports/createExport";
import { exportToCanva } from "~/server/trpc/procedures/exports/exportToCanva";

// Minio procedures
import { getMinioBaseUrl } from "~/server/trpc/procedures/minio/getMinioBaseUrl";

// KDP procedures
import { generateCoverUploadUrl } from "~/server/trpc/procedures/kdp/generateCoverUploadUrl";
import { generateAICover } from "~/server/trpc/procedures/kdp/generateAICover";
import { generateMultipleAICovers } from "~/server/trpc/procedures/kdp/generateMultipleAICovers";

// Billing procedures
import { getUserBillingInfo } from "~/server/trpc/procedures/billing/getUserBillingInfo";
import { purchaseAICredits } from "~/server/trpc/procedures/billing/purchaseAICredits";
import { upgradeSubscription } from "~/server/trpc/procedures/billing/upgradeSubscription";

export const appRouter = createTRPCRouter({
  // Auth
  auth: {
    signup,
    login,
  },
  
  // Projects
  projects: {
    list: listProjects,
    create: createProject,
    get: getProject,
    update: updateProject,
    delete: deleteProject,
  },
  
  // Chapters
  chapters: {
    create: createChapter,
    update: updateChapter,
    delete: deleteChapter,
  },
  
  // Agents
  agents: {
    list: listAgents,
    assign: assignAgent,
  },
  
  // Users
  users: {
    getProfile: getUserProfile,
    updateProfile: updateUserProfile,
  },
  
  // Modules
  modules: {
    getStats: getModuleStats,
  },
  
  // AI
  ai: {
    generateChapter,
    analyzeVoice,
    generateOutline,
    checkConsistency,
    calculateReadability,
    generateMarketing,
    getSuggestionsStream,
    rewriteTextStream,
    expandTextStream,
    generateKeywords,
    suggestTitles,
    suggestMetadata,
    generateBlurb,
    adhd: {
      getEncouragement,
      analyzeRoadblock,
    },
    brainstorm: {
      processIdeaPot,
    },
  },
  
  // Templates
  templates: {
    list: listTemplates,
  },
  
  // Exports
  exports: {
    create: createExport,
    toCanva: exportToCanva,
  },
  
  // Minio
  minio: {
    getBaseUrl: getMinioBaseUrl,
  },
  
  // KDP
  kdp: {
    generateCoverUploadUrl,
    generateAICover,
    generateMultipleAICovers,
  },
  
  // Billing
  billing: {
    getUserBillingInfo,
    purchaseAICredits,
    upgradeSubscription,
  },
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
