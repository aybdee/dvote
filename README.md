# Cartesi Voting DApp

## Overview

This Cartesi DApp provides a decentralized platform for managing elections and voting. It allows users to register voters, create and end elections, cast votes, and register voter IDs. It utilizes Cartesi's infrastructure to ensure secure and reliable operations.

## Installation and Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/aybdee/dvote.git
   cd devote
   ```

2. **Install Dependencies:**

   This project uses `pnpm`. If you don't have it installed, you can install it via:

   ```bash
   npm install -g pnpm
   ```

   Then, install the project dependencies:

   ```bash
   pnpm install
   ```

3. **Setup Environment Variables:**

   Create a `.env` file in the root directory and add your configuration. Include the `SECRET_KEY` used for elevated operations:

   ```env
   SECRET_KEY=your_secret_key_here
   ```

4. **Build and Run the Application:**

   ```bash
   pnpm build
   pnpm start
   ```

## Usage

### Payload Structure

The DApp uses the following structure for sending payloads:

```json
{
  "action": "REGISTER_VOTER",
  "data": {
    "voterId": "voter123",
    "firstname": "John",
    "lastname": "Doe",
    "phoneNo": "1234567890"
  },
  "secretKey": "your_secret_key_here"
}
```

### Sending Commands

Commands are sent using the `cartesi send` utility. Here are examples for each action:

- **Register Voter:**

  ```bash
  cartesi send --payload '{
    "action": "REGISTER_VOTER",
    "data": {
      "voterId": "voter123",
      "firstname": "John",
      "lastname": "Doe",
      "phoneNo": "1234567890"
    },
    "secretKey": "your_secret_key_here"
  }'
  ```

- **Vote:**

  ```bash
  cartesi send --payload '{
    "action": "VOTE",
    "data": {
      "electionId": "election123",
      "candidateId": "candidate456"
    }
  }'
  ```

- **Create Election:**

  ```bash
  cartesi send --payload '{
    "action": "CREATE_ELECTION",
    "data": {
      "name": "Presidential Election 2024",
      "candidateId": "candidate789",
      "resultId": "result123"
    },
    "secretKey": "your_secret_key_here"
  }'
  ```

- **End Election:**

  ```bash
  cartesi send --payload '{
    "action": "END_ELECTION",
    "data": "election123",
    "secretKey": "your_secret_key_here"
  }'
  ```

- **Register Voter IDs:**

  ```bash
  cartesi send --payload '{
    "action": "REGISTER_VOTER_IDs",
    "data": ["voter123", "voter456"],
    "secretKey": "your_secret_key_here"
  }'
  ```

### Notices and Vouchers

After each command, a notice will be issued with the result of the operation. When an election is ended, a voucher containing the final results of the election will be issued.

### Checking Results

- **Current Election Results:**

  ```http
  GET {{INSPECT_URL}}/result/:electionId/
  ```

- **Specific Candidate Results:**

  ```http
  GET {{INSPECT_URL}}/result/:electionId/:candidateId
  ```

Replace `:electionId` and `:candidateId` with the respective IDs.
