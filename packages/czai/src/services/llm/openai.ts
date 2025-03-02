import OpenAI from 'openai';
import type { CommitConfig, LLMPromptContext } from './types.js';

export async function generateCommitWithOpenAI(
  apiKey: string,
  model: string,
  context: LLMPromptContext
): Promise<CommitConfig> {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const typeOptions = context.typeEnum?.map(type => {
    const description = context.typeDescriptions?.[type]?.description || '';
    const emoji = context.typeDescriptions?.[type]?.emoji || '';
    const title = context.typeDescriptions?.[type]?.title || '';
    return `${type}${emoji ? ` (${emoji})` : ''}: ${description}${title ? ` (${title})` : ''}`;
  }).join('\n') || '';

  const systemPrompt = `You are a commit message generator. Based on the git changes, generate a conventional commit message that follows the commit conventions.
  
The commit should follow this format:
<type>[(scope)]: <subject>
[BLANK LINE]
[body]
[BLANK LINE]
[footer]

Available types:
${typeOptions}

Scope guidelines:
- The scope should represent the area of the codebase being modified
- If the changes affect multiple areas, use a comma-separated list or select the most significant area
- If unsure, use "global" as the scope
- If the scope is not relevant, it can be omitted
- Analyze the changed files and determine the most appropriate scope based on directories, modules or components
- Scopes are usually short (one or two words) and lowercase

Subject constraints:
${context.subject.case ? '- Case style: ' + context.subject.case.join(', ') : ''}
${context.subject.maxLength ? '- Max length: ' + context.subject.maxLength + ' characters' : ''}
${context.subject.minLength ? '- Min length: ' + context.subject.minLength + ' characters' : ''}

${context.headerMaxLength ? 'Header max length (type + scope + subject): ' + context.headerMaxLength + ' characters' : ''}
${context.headerMinLength ? 'Header min length (type + scope + subject): ' + context.headerMinLength + ' characters' : ''}

Return a JSON object with these fields:
{
  "type": "the commit type",
  "scope": "the commit scope (optional)",
  "subject": "the commit subject line",
  "body": "the commit body (optional)",
  "isBreaking": boolean,
  "breakingBody": "description of breaking changes (if isBreaking is true)",
  "issues": ["list of issue references"],
  "references": ["list of other references"]
}`;

  const userPrompt = `Here are the changes to commit:
${context.diff ? `Diff:\n${context.diff}\n` : ''}
${context.files ? `Files changed:\n${context.files}` : ''}

Based on these changes, generate an appropriate commit message following the conventions.`;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content) as CommitConfig;
  } catch (error) {
    console.error('Error generating commit with OpenAI:', error);
    throw error;
  }
}