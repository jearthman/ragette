import { PromptTemplate } from "langchain/prompts";

export const QuestionCheckPrompt: String =
  "Determine whether the user message is either directly asking a question or indirectly suggesting the need for more information. Respond with 'yes' if the text falls into either of these categories, and 'no' if it does neither.";
