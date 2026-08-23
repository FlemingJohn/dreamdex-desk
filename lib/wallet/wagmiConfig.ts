import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

/**
 * Wallet connection for the desk.
 *
 * Shannon only. Event contracts exist on mainnet too, but this desk signs real
 * transactions and there is no reason to point it at real money while the
 * analytics are still being proved out.
 *
 * Injected connectors only — MetaMask, Rabby, Brave and anything else that
 * announces itself. WalletConnect would need a project id and a relay, which is
 * setup a trader has to do before they can look at a single number.
 */
export const wagmiConfig = createConfig({
  chains: [somniaShannon],
  connectors: [injected()],
  transports: {
    [somniaShannon.id]: http("https://dream-rpc.somnia.network"),
  },
  ssr: true,
});

export const SHANNON_CHAIN_ID = somniaShannon.id;
