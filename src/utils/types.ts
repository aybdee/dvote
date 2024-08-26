export interface Voter {
  firstname: string;
  lastname: string;
  //generic ID to represent each voter (NIN in nigeria for instance)
  ID: string;
  phoneNo: string;
}

export interface Election {
  id?: number;
  name: string;
  candidates: Candidate[];
  results: Result[];
}

export interface Candidate {
  id: string;
  name: string;
  manifesto: string;
}

export interface Result {
  candidateId: string;
  votes: number;
}

export interface Vote {
  voterId: string;
  electionId: number;
  candidateId: string;
}

export interface Payload {
  action:
  | "REGISTER_VOTER"
  | "VOTE"
  | "CREATE_ELECTION"
  | "END_ELECTION"
  | "REGISTER_VOTER_IDs";

  data: Voter | Election | Vote | string[];
  secretKey?: string;
}

export function isVote(data: any): data is Vote {
  return (
    typeof data === "object" &&
    typeof data.voterId === "string" &&
    typeof data.candidateId === "string"
  );
}

export function isVoter(data: any): data is Voter {
  return (
    typeof data === "object" &&
    typeof data.firstname === "string" &&
    typeof data.lastname === "string" &&
    typeof data.ID === "string" &&
    typeof data.phoneNo === "string"
  );
}

export function isElection(data: any): data is Election {
  return (
    typeof data === "object" &&
    typeof data.name === "string" &&
    Array.isArray(data.candidates) &&
    Array.isArray(data.results)
  );
}

export function isStringArray(data: any): data is string[] {
  return Array.isArray(data) && data.every((item) => typeof item === "string");
}
