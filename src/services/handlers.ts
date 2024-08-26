import {
  createVoter,
  createElection as createElectiondb,
  getElectionResults as getElectionResultdb,
  getVoter,
  vote as votedb,
  getElectionResults,
} from "../utils/db";
import { isElection, isVote, isVoter, Payload } from "../utils/types";
import { sendErrorNotice, sendSuccessNotice } from "./notices";

const SECRET_KEY = process.env.SECRET_KEY;

export async function registerVoterHandler(app: any, payload: Payload) {
  if (isVoter(payload.data)) {
    createVoter(payload.data);
    await sendSuccessNotice(app, "Succesfully Registered Voter");
  } else {
    await sendErrorNotice(app, "Arguments to register voter are not correct");
  }
}

export async function createElection(app: any, payload: Payload) {
  if (isElection(payload.data)) {
    if (payload.secretKey == SECRET_KEY) {
      createElectiondb(payload.data.name);

      await sendSuccessNotice(app, "Election has been created");
    } else {
      await sendErrorNotice(
        app,
        "You dont have the permissions to carry out this action",
      );
    }
  } else {
    await sendErrorNotice(app, "Arguments to create election are not correct");
  }
}

export async function vote(app: any, payload: Payload) {
  if (isVote(payload.data)) {
    if (getVoter(payload.data.voterId)) {
      votedb(
        payload.data.electionId,
        payload.data.voterId,
        payload.data.candidateId,
      );

      await sendSuccessNotice(app, "Vote has been casted");
    } else {
      await sendErrorNotice(
        app,
        `voter with id ${payload.data.voterId} does not exist`,
      );
    }
  } else {
    await sendErrorNotice(app, "Arguments to vote are not correct");
  }
}

export async function endElection(app: any, payload: Payload) {
  if (isElection(payload.data)) {
    if (payload.secretKey == SECRET_KEY) {
      await app.createVoucher(
        JSON.stringify(getElectionResults(payload.data.id!)),
      );
      await sendSuccessNotice(app, "Election has ended");
    } else {
      await sendErrorNotice(
        app,
        "You do not have the permissions to carry out this action",
      );
    }
  } else {
    await sendErrorNotice(app, "Arguments to end election are not correct");
  }
}
