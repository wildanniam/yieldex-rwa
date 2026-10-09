import { useCopilotChat } from '@copilotkit/react-core';
type Msg = ReturnType<typeof useCopilotChat>['visibleMessages'][0];
type Keys = keyof Msg;
