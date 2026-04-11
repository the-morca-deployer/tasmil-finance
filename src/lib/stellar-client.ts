import { rpc } from "@stellar/stellar-sdk";
import { activeNetwork } from "@/shared/config/stellar";

let sorobanClient: rpc.Server | null = null;

export function getSorobanClient(): rpc.Server {
  if (!sorobanClient) {
    sorobanClient = new rpc.Server(activeNetwork.sorobanRpcUrl, {
      allowHttp: activeNetwork.sorobanRpcUrl.startsWith("http://"),
    });
  }
  return sorobanClient;
}
