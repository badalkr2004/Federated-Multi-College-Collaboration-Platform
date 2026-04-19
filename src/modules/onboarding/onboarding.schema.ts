import { z } from 'zod';

export const CollegeRequestSchema = z.object({
  name: z.string().min(3).max(100),
  domain: z.string().regex(
    /^projects\.[a-z0-9-]+(\.[a-z0-9-]+)*$/,
    "Must follow pattern: projects.collegename.localhost or projects.college.ac.in"
  ),
  emailDomain: z.string().regex(
    /^@[a-z0-9.-]+\.[a-z]{2,}$/,
    "Must follow pattern: @college.ac.in"
  ),
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
});

export type CollegeRequestInput = z.infer<typeof CollegeRequestSchema>;
