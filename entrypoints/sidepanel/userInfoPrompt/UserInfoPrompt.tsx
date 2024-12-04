import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput, useStreamExample } from "@llm-ui/react";
import { MarkdownComponent } from "./Markdown";
import { CodeBlock } from "./CodeBlock";
import { jsonBlock, jsonBlockPrompt } from "@llm-ui/json";
import { UserInfoBlock, userInfoSchema } from "./UserInfoBlock";
import { Container, HStack, Input, IconButton, Textarea } from "@chakra-ui/react";
import { MdAdd, MdSend } from "react-icons/md";

const systemPrompt = jsonBlockPrompt({
  name: "UserInfo",
  schema: userInfoSchema,
  examples: [
    {
      type: "userInfo",
      userInfo: [
        { key: "name", value: "John" },
        { key: "email", value: "john@example.com" },
      ],
    },
  ],
  options: {
    type: "userInfo",
  },
});

export const UserInfoPrompt = ({ selectedUserKey }: { selectedUserKey: string }) => {
  const [userInput, setUserInput] = useState("");
  const [llmOutput, setLlmOutput] = useState("");
  const [isStreamFinished, setIsStreamFinished] = useState(false);
  const { blockMatches, restart } = useLLMOutput({
    llmOutput: llmOutput,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
      {
        ...jsonBlock({ type: "userInfo" }),
        component: (props) => <UserInfoBlock {...props} selectedUserKey={selectedUserKey} />,
      },
    ],
    isStreamFinished,
  });

  async function handleUserInputSubmit() {
    setLlmOutput("");
    const session = await chrome.aiOriginTrial.languageModel.create({
      systemPrompt: `You are a chatbot that helps take in user input and present them in a way that can be used to fill in forms.
You give short answers.
${systemPrompt}`,
    });

    const stream = session.promptStreaming(userInput);
    for await (const chunk of stream) {
      console.log(chunk);
      setLlmOutput(llmOutput + chunk);
    }
    setIsStreamFinished(true);
  }

  return (
    <>
      <HStack marginBlock={4}>
        <Field label="Add user information">
          <Textarea
            placeholder="Start typing..."
            variant="outline"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
        </Field>
        <IconButton rounded="full" onClick={() => handleUserInputSubmit()}>
          <MdSend />
        </IconButton>
      </HStack>
      {llmOutput && (
        <Container borderColor="gray.800" borderWidth={1} borderRadius="md" padding={4}>
          {blockMatches.map((blockMatch, index) => {
            const Component = blockMatch.block.component;
            return <Component key={index} blockMatch={blockMatch} />;
          })}
        </Container>
      )}
    </>
  );
};
