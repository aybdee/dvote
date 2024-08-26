import Database from "better-sqlite3";

const db = new Database("sqlite.db");

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      election_id INTEGER,
      voter_id TEXT,
      candidate_id TEXT,
      FOREIGN KEY (election_id) REFERENCES elections(id),
      FOREIGN KEY (voter_id) REFERENCES validIDs(voter_id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      UNIQUE(election_id, voter_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS voters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voterId TEXT NOT NULL UNIQUE,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      phone_no TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      manifesto TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS elections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS election_candidates (
      election_id INTEGER,
      candidate_id TEXT,
      PRIMARY KEY (election_id, candidate_id),
      FOREIGN KEY (election_id) REFERENCES elections(id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      election_id INTEGER,
      candidate_id TEXT,
      votes INTEGER NOT NULL,
      FOREIGN KEY (election_id) REFERENCES elections(id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      UNIQUE(election_id, candidate_id)
    );

    CREATE TABLE IF NOT EXISTS validIDs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_id TEXT UNIQUE
    );
  `);
}

createTables();

function generateUUID(): string {
  return Math.floor(Math.random() * 100000000000000000).toString();
}

export function createVoter(voter: {
  ID: string;
  firstname: string;
  lastname: string;
  phoneNo: string;
}) {
  const stmt = db.prepare(
    "INSERT INTO voters (voterId, firstname, lastname, phone_no) VALUES (?, ?, ?, ?)",
  );
  stmt.run(voter.ID, voter.firstname, voter.lastname, voter.phoneNo);
}

export function registerVoterIds(ids: string[]) {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO validIDs (voter_id) VALUES (?)",
  );
  const insertMany = db.transaction((ids) => {
    for (const id of ids) {
      stmt.run(id);
    }
  });
  insertMany(ids);
}

export function createElection(name: string) {
  const stmt = db.prepare("INSERT INTO elections (name) VALUES (?)");
  const result = stmt.run(name);
  return result.lastInsertRowid;
}

export function addCandidateToElection(
  electionId: number,
  candidateId: string,
) {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO election_candidates (election_id, candidate_id) VALUES (?, ?)",
  );
  stmt.run(electionId, candidateId);
}

export function deleteElection(electionId: number) {
  const deleteElection = db.prepare("DELETE FROM elections WHERE id = ?");
  const deleteCandidates = db.prepare(
    "DELETE FROM election_candidates WHERE election_id = ?",
  );
  const deleteResults = db.prepare("DELETE FROM results WHERE election_id = ?");

  const transaction = db.transaction((id) => {
    deleteResults.run(id);
    deleteCandidates.run(id);
    deleteElection.run(id);
  });

  transaction(electionId);
}

export function getVoter(voterId: string) {
  const stmt = db.prepare("SELECT * FROM voters WHERE voterId = ?");
  return stmt.get(voterId);
}

export function getElection(electionId: number) {
  const election = db
    .prepare("SELECT * FROM elections WHERE id = ?")
    .get(electionId);
  if (!election) return null;

  const candidates = db
    .prepare(
      `
    SELECT c.* FROM candidates c
    JOIN election_candidates ec ON c.id = ec.candidate_id
    WHERE ec.election_id = ?
  `,
    )
    .all(electionId);

  const results = db
    .prepare(
      `
    SELECT * FROM results WHERE election_id = ?
  `,
    )
    .all(electionId);

  return { ...election, candidates, results };
}

export function addResultToElection(
  electionId: number,
  candidateId: string,
  votes: number,
) {
  const stmt = db.prepare(`
    INSERT INTO results (election_id, candidate_id, votes)
    VALUES (?, ?, ?)
    ON CONFLICT(election_id, candidate_id) DO UPDATE SET votes = votes + ?
  `);
  stmt.run(electionId, candidateId, votes, votes);
}

export function vote(
  electionId: number,
  voterId: string,
  candidateId: string,
): boolean {
  const transaction = db.transaction(() => {
    const validVoter = db
      .prepare("SELECT * FROM validIDs WHERE voter_id = ?")
      .get(voterId);
    if (!validVoter) {
      throw new Error("Invalid voter ID");
    }

    const existingVote = db
      .prepare("SELECT * FROM votes WHERE election_id = ? AND voter_id = ?")
      .get(electionId, voterId);
    if (existingVote) {
      throw new Error("Voter has already cast a vote in this election");
    }

    const candidateInElection = db
      .prepare(
        "SELECT * FROM election_candidates WHERE election_id = ? AND candidate_id = ?",
      )
      .get(electionId, candidateId);
    if (!candidateInElection) {
      throw new Error("Candidate is not part of this election");
    }

    db.prepare(
      "INSERT INTO votes (election_id, voter_id, candidate_id) VALUES (?, ?, ?)",
    ).run(electionId, voterId, candidateId);

    const updateResult = db.prepare(`
      INSERT INTO results (election_id, candidate_id, votes)
      VALUES (?, ?, 1)
      ON CONFLICT(election_id, candidate_id) DO UPDATE SET votes = votes + 1
    `);
    updateResult.run(electionId, candidateId);

    return true;
  });

  try {
    return transaction();
  } catch (error: any) {
    console.error("Voting failed:", error.message);
    return false;
  }
}

export function getElectionResults(electionId: number) {
  // First, check if the election exists
  const election: any = db
    .prepare("SELECT * FROM elections WHERE id = ?")
    .get(electionId);
  if (!election) {
    throw new Error("Election not found");
  }

  // Get all candidates and their vote counts for this election
  const results: any = db
    .prepare(
      `
    SELECT 
      c.id AS candidateId,
      c.name AS candidateName,
      COALESCE(r.votes, 0) AS voteCount
    FROM 
      election_candidates ec
    JOIN 
      candidates c ON ec.candidate_id = c.id
    LEFT JOIN 
      results r ON r.election_id = ec.election_id AND r.candidate_id = c.id
    WHERE 
      ec.election_id = ?
    ORDER BY 
      voteCount DESC
  `,
    )
    .all(electionId);

  // Get the total number of votes cast in this election
  const total: any = db.prepare(
    `
    SELECT COUNT(*) as count
    FROM votes
    WHERE election_id = ?
  `,
  );

  let totalVotes = total.get(electionId).count;

  return {
    electionId: election.id,
    electionName: election.name,
    totalVotes,
    results: results.map((result: any) => ({
      candidateId: result.candidateId,
      candidateName: result.candidateName,
      voteCount: result.voteCount,
      percentage:
        totalVotes > 0
          ? ((result.voteCount / totalVotes) * 100).toFixed(2) + "%"
          : "0%",
    })),
  };
}

export function getElectionResultsForCandidate(
  electionId: number,
  candidateId: number,
) {
  // First, check if the election exists
  const election: any = db
    .prepare("SELECT * FROM elections WHERE id = ?")
    .get(electionId);
  if (!election) {
    throw new Error("Election not found");
  }

  // Get all candidates and their vote counts for this election
  const results: any = db
    .prepare(
      `
    SELECT 
      c.id AS candidateId,
      c.name AS candidateName,
      COALESCE(r.votes, 0) AS voteCount
    FROM 
      election_candidates ec
    JOIN 
      candidates c ON ec.candidate_id = c.id
    LEFT JOIN 
      results r ON r.election_id = ec.election_id AND r.candidate_id = c.id
    WHERE 
      ec.election_id = ?
    ORDER BY 
      voteCount DESC
  `,
    )
    .all(electionId);

  // Get the total number of votes cast in this election
  const total: any = db.prepare(
    `
    SELECT COUNT(*) as count
    FROM votes
    WHERE election_id = ?
  `,
  );

  let totalVotes = total.get(electionId).count;

  return {
    electionId: election.id,
    electionName: election.name,
    totalVotes,
    results: results.map((result: any) => ({
      candidateId: result.candidateId,
      candidateName: result.candidateName,
      voteCount: result.voteCount,
      percentage:
        totalVotes > 0
          ? ((result.voteCount / totalVotes) * 100).toFixed(2) + "%"
          : "0%",
    })),
  };
}
