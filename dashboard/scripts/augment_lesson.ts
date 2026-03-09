import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import { augmentLesson } from '../lib/ai-augmentor';

async function main() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY is not set in environment variables.");
        console.error("Please create a .env file in the dashboard directory with GOOGLE_GENERATIVE_AI_API_KEY=...");
        process.exit(1);
    }

    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Usage: npx tsx scripts/augment_lesson.ts <path-to-content-json> [output-path]");
        process.exit(0);
    }

    const inputPath = args[0];
    const outputPath = args[1] || inputPath;

    try {
        const resolvedInputPath = path.resolve(process.cwd(), inputPath);
        console.log(`Reading lesson from ${resolvedInputPath}...`);
        
        const content = await fs.readFile(resolvedInputPath, 'utf-8');
        const lesson = JSON.parse(content);

        console.log("Augmenting lesson with AI (Gemini)...");
        const augmentedLesson = await augmentLesson(lesson as any);

        console.log(`Writing augmented lesson to ${outputPath}...`);
        await fs.writeFile(outputPath, JSON.stringify(augmentedLesson, null, 2));

        console.log("Done!");
    } catch (error) {
        console.error("Error processing lesson:", error);
        process.exit(1);
    }
}

main();
