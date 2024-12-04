import { type LLMOutputComponent } from "@llm-ui/react";
import { parseJson5 } from "@llm-ui/json";
import z from "zod";
import { List, ListItem, Text, IconButton, Stack, Heading } from "@chakra-ui/react";
import { MdAdd } from "react-icons/md";
import { MdCheck } from "react-icons/md";

export const userInfoSchema = z.object({
  type: z.literal("userInfo"),
  userInfo: z.array(z.object({ key: z.string(), value: z.string() })),
});

export const UserInfoBlock: LLMOutputComponent<{ selectedUserKey: string }> = ({ blockMatch, selectedUserKey }) => {
  if (!blockMatch.isVisible) {
    return null;
  }
  const { data: userInfo, error } = userInfoSchema.safeParse(parseJson5(blockMatch.output));

  const [filledUserInfo, setFilledUserInfo] = useState<Record<string, string>>({});

  async function addUserInfo(key: string, value: string) {
    setFilledUserInfo({ ...filledUserInfo, [key]: value });

    const currentUserList: any[] = (await storage.getItem("local:userInfo")) || [];
    const currentUserIndex = currentUserList.findIndex((user) => user.key === selectedUserKey);
    const currentUser = currentUserList[currentUserIndex];

    // replace the current user at the same index with the new user information
    const newUserList = [...currentUserList];
    newUserList[currentUserIndex] = { ...currentUser, [key]: value };
    storage.setItem("local:userInfo", newUserList);
  }

  if (error) {
    return <div>{error.toString()}</div>;
  }
  return (
    <List.Root gap="2" variant="plain" align="center" marginBlock={4}>
      <Heading size="sm">Information Detected:</Heading>
      {userInfo.userInfo
        .filter((info) => !["name", "email"].includes(info.key))
        .map((info) => (
          <ListItem
            key={info.key}
            display="flex"
            justifyContent="space-between"
            borderColor="gray.500"
            borderWidth={1}
            borderRadius="md"
            padding={2}
          >
            <Stack>
              <Heading size="sm">{info.key}</Heading>
              <Text>
                Add item {info.key} with value {info.value}?
              </Text>
            </Stack>

            {filledUserInfo[info.key] ? (
              <IconButton colorPalette="green" variant="outline" rounded="full" disabled={true}>
                <MdCheck />
              </IconButton>
            ) : (
              <IconButton variant="outline" rounded="full" onClick={() => addUserInfo(info.key, info.value)}>
                <MdAdd />
              </IconButton>
            )}
          </ListItem>
        ))}
    </List.Root>
  );
};
