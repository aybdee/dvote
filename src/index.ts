import { createApp } from "@deroll/app";
import { createRouter } from "@deroll/router";
import { hexToString, stringToHex } from "viem";
import { Payload } from "./utils/types";
import { sendErrorNotice } from "./services/notices";
import {
  createElection,
  registerVoterHandler,
  vote,
} from "./services/handlers";

import { getElectionResults, getElectionResultsForCandidate } from "./utils/db";

const app = createApp({ url: "http://127.0.0.1:5004" });
const router = createRouter({ app });

app.addAdvanceHandler(async ({ payload }) => {
  let strPayload = hexToString(payload);
  let payloadProcessed: Payload = JSON.parse(strPayload);
  switch (payloadProcessed.action) {
    case "REGISTER_VOTER":
      registerVoterHandler(app, payloadProcessed);
      break;

    case "VOTE":
      vote(app, payloadProcessed);
      break;

    case "CREATE_ELECTION":
      createElection(app, payloadProcessed);
      break;

    case "END_ELECTION":
      break;

    default:
      await sendErrorNotice(app, "Invalid action");
      break;
  }
  return "accept";
});

router.add<{ candidate: string; election: string }>(
  "result/:election/:candidate",
  ({ params: { candidate, election } }) => {
    return JSON.stringify({
      data: getElectionResultsForCandidate(
        parseInt(election),
        parseInt(candidate),
      ),
    });
  },
);

router.add<{ candidate: string; election: string }>(
  "result/:election/",
  ({ params: { election } }) => {
    return JSON.stringify({
      data: getElectionResults(parseInt(election)),
    });
  },
);

app.addInspectHandler(router.handler);

// start app
app.start().catch((e) => process.exit(1));
