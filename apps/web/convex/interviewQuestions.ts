import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new interview question
export const create = mutation({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
    question: v.string(),
    order: v.number(),
    isAIGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("interviewQuestions", {
      jobDescriptionId: args.jobDescriptionId,
      question: args.question,
      order: args.order,
      isAIGenerated: args.isAIGenerated,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return questionId;
  },
});

// Get questions by job description ID
export const getByJobDescription = query({
  args: { jobDescriptionId: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewQuestions")
      .withIndex("by_job_description", (q) => q.eq("jobDescriptionId", args.jobDescriptionId))
      .collect();
  },
});

// Get question by ID
export const getById = query({
  args: { id: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update question
export const update = mutation({
  args: {
    id: v.id("interviewQuestions"),
    question: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Only include fields that were provided
    const fieldsToUpdate: any = { ...updates, updatedAt: Date.now() };
    
    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Delete question
export const remove = mutation({
  args: { id: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Generate AI questions based on job description
export const generateAIQuestions = mutation({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
  },
  handler: async (ctx, args) => {
    // Get the job description
    const jobDescription = await ctx.db.get(args.jobDescriptionId);
    
    if (!jobDescription) {
      throw new Error("Job description not found");
    }
    
    try {
      // Call the Python API to generate questions
      const apiUrl = process.env.API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobDescription.title,
          description: jobDescription.description,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const aiQuestions = data.questions;
      
      // Create the questions in the database
      const questionIds = [];
      
      for (const question of aiQuestions) {
        const questionId = await ctx.db.insert("interviewQuestions", {
          jobDescriptionId: args.jobDescriptionId,
          question: question.question,
          order: question.order,
          isAIGenerated: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        questionIds.push(questionId);
      }
      
      return questionIds;
    } catch (error) {
      console.error("Error generating AI questions:", error);
      
      // Fallback to placeholder questions if API call fails
      const placeholderQuestions = [
        "Tell me about your experience in this field.",
        "What are your strengths and weaknesses?",
        "Why do you want to work for this company?",
        "Describe a challenging situation you faced at work and how you handled it.",
        "What are your career goals?",
        "How do you handle stress and pressure?",
        "What is your greatest professional achievement?",
        "How do you stay updated with industry trends?",
        "Describe your ideal work environment.",
        "Do you have any questions for us?",
      ];
      
      // Create the questions in the database
      const questionIds = [];
      
      for (let i = 0; i < placeholderQuestions.length; i++) {
        const questionId = await ctx.db.insert("interviewQuestions", {
          jobDescriptionId: args.jobDescriptionId,
          question: placeholderQuestions[i],
          order: i + 1,
          isAIGenerated: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        questionIds.push(questionId);
      }
      
      return questionIds;
    }
  },
});
