import {
  Button,
  Code,
  Container,
  Fieldset,
  Group,
  Heading,
  HStack,
  Input,
  List,
  ProgressLabel,
  ProgressRoot,
  Stack,
  Text,
} from "@chakra-ui/react";
import { RadioCardItem, RadioCardLabel, RadioCardRoot } from "@/components/radio-card";
import { Field } from "@/components/field";
import { ProgressBar } from "@/components/progress";
import { MdAdd, MdCheckCircle, MdDelete, MdDeleteOutline, MdInfo } from "react-icons/md";
import { storage } from "wxt/storage";
import { UserInfoPrompt } from "./userInfoPrompt/UserInfoPrompt";
import { Tooltip } from "@/components/tooltip";

const SYSTEM_PROMPT = `You are a helpful assistant identifies form fields, and fills them based on the user information provided.
You will be given a string of HTML, and a JSON object with user information.

Using the HTML, identify the user fillable fields.
{
  "label": string; // human readable label for the field
  "selector": string; // selector that will work with querySelector
  "type": string; // type of field
}
Make sure the selector will work with querySelector. ALWAYS prefer name attribute over id.

Then try and fill in the fields with the information provided ONLY fill in fields that were identified.
The output should be a JSON object with the following format:
[
  {
    "label": string;
    "selector": string;
    "type": string;
    "value": string; // value to be filled
  }
]

There can only be one value for a given label.
Try to fill in the full address when possible.

ONLY return the JSON object, nothing else.
`;

function App() {
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | "COMPLETED" | "NOT_STARTED">("NOT_STARTED");
  const [processingAutoFill, setProcessingAutoFill] = useState(false);
  const [autoFillResult, setAutoFillResult] = useState<string | null>(null);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [selectedUserKey, setSelectedUserKey] = useState<string | null>(null);

  async function setupFormProcessor() {
    const { supported, error } = await isPromptAISupported();
    if (!supported) {
      setError(error);
      return;
    }

    const session = await chrome.aiOriginTrial.languageModel.create({
      systemPrompt: SYSTEM_PROMPT,
      monitor: (m) => {
        m.addEventListener("downloadprogress", (e: any) => {
          const downloadProgressPercentage = Number(((e.loaded / e.total) * 100).toFixed(2));
          if (downloadProgressPercentage === 100) {
            setDownloadProgress("COMPLETED");
          } else {
            setDownloadProgress(downloadProgressPercentage);
          }
        });
      },
    });

    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      if (request.type === "SANITIZED_FORM_DATA") {
        const userInfo = await storage.getItem(`local:userInfo`, { fallback: [] });
        const selectedUser = userInfo.find((user: any) => user.key === selectedUserKey);

        const prompt = `HTML: ${request.data} USER_INFO: ${JSON.stringify(selectedUser)}`;
        console.log(prompt);

        try {
          const sessionClone = await session.clone();
          const result = await sessionClone.prompt(prompt);
          setAutoFillResult(result);
          await sendMessageToTab("WRITE_FORM_DATA", result);
        } catch (e) {
          setAutoFillError((e as Error).toString());
        } finally {
          setProcessingAutoFill(false);
        }
      }
    });
  }

  useEffect(() => {
    setupFormProcessor();
  }, []);

  const handleAutoFillClick = () => {
    setAutoFillResult(null);
    setAutoFillError(null);

    sendMessageToTab("REQUEST_FORM_DATA", "", (e) => {
      setProcessingAutoFill(false);
      setAutoFillError(e.toString());
    });
    setProcessingAutoFill(true);
  };

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  const isDownloading = downloadProgress !== "COMPLETED" && downloadProgress !== "NOT_STARTED";

  return (
    <Container>
      <Stack height="100vh" p={4} paddingBlock={8} justifyContent="space-between">
        <Stack>
          <UserProfile selectedUserKey={selectedUserKey} setSelectedUserKey={setSelectedUserKey} />
          {selectedUserKey && <UserInfoPrompt selectedUserKey={selectedUserKey} />}
        </Stack>

        <Stack gap="4">
          {isDownloading && (
            <ProgressRoot value={downloadProgress} striped animated w="100%">
              <ProgressLabel>Downloading model...</ProgressLabel>
              <ProgressBar />
            </ProgressRoot>
          )}

          {processingAutoFill && (
            <Stack>
              <ProgressRoot striped animated w="100%" value={100}>
                <ProgressLabel>Processing...</ProgressLabel>
                <ProgressBar />
              </ProgressRoot>
            </Stack>
          )}

          {autoFillResult && <AutoFillList autoFillResult={autoFillResult || ""} />}

          {autoFillError && <Text color="red">{autoFillError}</Text>}

          <Button onClick={handleAutoFillClick}>Auto Fill</Button>
        </Stack>
      </Stack>
    </Container>
  );
}

function UserProfile({
  selectedUserKey,
  setSelectedUserKey,
}: {
  selectedUserKey: string | null;
  setSelectedUserKey: (key: string) => void;
}) {
  // get user information from storage
  const [userInfo, setUserInfo] = useState<any>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    storage.getItem("local:userInfo", { fallback: [] }).then((data) => {
      setUserInfo(data);
      if (selectedUserKey === null && data.length > 0) {
        setSelectedUserKey(data[0]["key"]);
      }
    });

    storage.watch("local:userInfo", (data) => {
      setUserInfo(data);
    });
  }, []);

  if (!userInfo || userInfo.length === 0 || isCreatingUser) {
    return (
      <>
        <Fieldset.Root size="lg" maxW="md">
          <Stack>
            <Fieldset.Legend>Contact details</Fieldset.Legend>
            <Fieldset.HelperText>
              Looks like you haven't set up your user profile yet. Please set up your user profile to continue.
            </Fieldset.HelperText>
          </Stack>

          <Fieldset.Content>
            <Field label="Name">
              <Input name="name" value={name || ""} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Field label="Email address">
              <Input name="email" type="email" value={email || ""} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </Fieldset.Content>

          <Button
            alignSelf="flex-start"
            onClick={() => {
              const currentUserInfo = userInfo || [];
              storage.setItem("local:userInfo", [
                ...currentUserInfo,
                { name, email, key: Math.random().toString(36).substring(2, 15) },
              ]);
              setIsCreatingUser(false);
            }}
          >
            Set up user profile
          </Button>
        </Fieldset.Root>
      </>
    );
  }

  return (
    <RadioCardRoot value={selectedUserKey} gap="4" maxW="sm">
      <RadioCardLabel>Select a user profile:</RadioCardLabel>
      <Group attached orientation="vertical">
        {userInfo.map((user: any) => (
          <RadioCardItem
            width="full"
            indicatorPlacement="start"
            label={
              <HStack>
                <Text>{user.name}</Text>
                <Tooltip content={JSON.stringify(user)}>
                  <MdInfo />
                </Tooltip>
              </HStack>
            }
            description={user.email}
            key={user.key}
            value={user.key}
            onChange={() => setSelectedUserKey(user.key)}
          />
        ))}
      </Group>

      <HStack justifyContent="space-between" w="full">
        <Button variant="outline" onClick={() => setIsCreatingUser(true)}>
          <MdAdd />
          Add User
        </Button>
        <Button
          disabled={selectedUserKey === null}
          variant="outline"
          colorPalette="red"
          onClick={() => {
            // remove user with the selected key from storage using selectedUserKey
            const currentUserInfo = userInfo || [];
            const newUserInfo = currentUserInfo.filter((user: any) => user.key !== selectedUserKey);
            storage.setItem(`local:userInfo`, newUserInfo);
          }}
        >
          <MdDeleteOutline />
          Remove User
        </Button>
      </HStack>
    </RadioCardRoot>
  );
}

function AutoFillList({ autoFillResult }: { autoFillResult: string }) {
  let fields: Array<{ label: string; selector: string; type: string; value: string }> = [];

  try {
    console.log(autoFillResult);
    fields = JSON.parse(autoFillResult);
  } catch (e) {
    return <Text color="red">Error parsing auto fill result. Please try again.</Text>;
  }

  return (
    <Stack>
      <Heading size="sm">Successfully identified fields:</Heading>
      <List.Root gap="2" variant="plain" align="center">
        {fields
          .filter((field) => field.value)
          .map((field) => (
            <List.Item key={field.label}>
              <List.Indicator asChild color="green.500">
                <MdCheckCircle />
              </List.Indicator>
              <b>{field.label}</b>: <Code>{field.value}</Code>
            </List.Item>
          ))}
      </List.Root>
    </Stack>
  );
}

async function sendMessageToTab(type: string, data: string, onError?: (e: Error) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type, data }).catch((e) => {
        if (onError) {
          onError(e);
        }
      });
    }
  });
}

async function isPromptAISupported() {
  if (!("aiOriginTrial" in chrome)) {
    return { supported: false, error: "Google AI Origin Trial not supported" };
  }
  const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
  if (capabilities.available === "no") {
    return { supported: false, error: "Prompt AI cannot be used at the moment" };
  }

  return { supported: true, error: null };
}

export default App;
