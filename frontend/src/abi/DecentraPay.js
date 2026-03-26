export const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS || "";

export const CONTRACT_ABI = [
  {
    type: "event", name: "PaymentSent",
    inputs: [
      { name: "from",      type: "address", indexed: true  },
      { name: "to",        type: "address", indexed: true  },
      { name: "amount",    type: "uint256", indexed: false },
      { name: "message",   type: "string",  indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "SplitPayment",
    inputs: [
      { name: "initiator",  type: "address",   indexed: true  },
      { name: "recipients", type: "address[]", indexed: false },
      { name: "amounts",    type: "uint256[]", indexed: false },
      { name: "groupNote",  type: "string",    indexed: false },
      { name: "timestamp",  type: "uint256",   indexed: false },
    ],
  },
  {
    type: "function", name: "sendPayment", stateMutability: "payable",
    inputs: [{ name: "recipient", type: "address" }, { name: "message", type: "string" }],
    outputs: [],
  },
  {
    type: "function", name: "splitPayment", stateMutability: "payable",
    inputs: [
      { name: "recipients", type: "address[]" },
      { name: "amounts",    type: "uint256[]" },
      { name: "groupNote",  type: "string"    },
    ],
    outputs: [],
  },
  {
    type: "function", name: "walletStats", stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [
      { name: "sent",     type: "uint256" },
      { name: "received", type: "uint256" },
      { name: "count",    type: "uint256" },
    ],
  },
  {
    type: "function", name: "totalVolume", stateMutability: "view",
    inputs: [], outputs: [{ type: "uint256" }],
  },
];
