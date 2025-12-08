import web3Config from "../web3/web3Config.json";
import { Contract, Provider } from "necjs";

export const contractCall = (contractABI, contractId, isWss = false) => {
  try {
    const rpcUrl = isWss ? web3Config?.WSS_RPC_URL : web3Config?.CHAIN_DETAILS?.rpcUrls[0];
    const provider = new Provider(rpcUrl);
    const contract = new Contract(contractId, contractABI, provider);
    return contract;
  } catch (error) {
    console.error("Error getting NEC provider:", error);
    return null;
  }
};