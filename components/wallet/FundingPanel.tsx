"use client";

import { Check, Copy, Droplet, ExternalLink, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useFundingStatus, TEST_USDC_SHANNON } from "@/hooks/useFundingStatus";
import { useWriteActions } from "@/hooks/useWriteActions";

const STT_FAUCET = "https://testnet.somnia.network/";
const GOOGLE_FAUCET = "https://cloud.google.com/web3/faucet?network=somnia";
const EXPLORER = "https://shannon-explorer.somnia.network";

/**
 * Getting a fresh wallet ready to trade.
 *
 * Two assets are needed from two different places, and the order is not
 * obvious: STT pays gas and only an external faucet can give it, while the
 * collateral is minted by the venue — but minting is itself a transaction, so a
 * wallet with no STT cannot claim the thing it needs.
 *
 * Discovering that by watching a signature fail is a poor introduction, so both
 * balances are shown, the address is one click to copy, and the mint button
 * disables itself with the reason when there is no gas to pay for it.
 */
export function FundingPanel() {
  const {
    address,
    isConnected,
    gasAmount,
    gasSymbol,
    collateralAmount,
    needsGas,
    isReadyToTrade,
    copied,
    copyAddress,
    refresh,
  } = useFundingStatus();
  const { claimTestFunds, pending } = useWriteActions();

  if (!isConnected || !address) {
    return null;
  }

  async function mintCollateral() {
    await claimTestFunds();
    refresh();
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Droplet className="size-4" />
          Funds
          {needsGas ? (
            <Badge variant="destructive" className="ml-1">
              no gas
            </Badge>
          ) : isReadyToTrade ? null : (
            <Badge variant="secondary" className="ml-1">
              setup
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold">Fund this wallet</p>
            <p className="text-xs text-muted-foreground">
              Gas first, then collateral — minting collateral costs gas.
            </p>
          </div>

          <div className="funding-address">
            <code className="funding-address-value">{address}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAddress}
              aria-label="Copy address"
            >
              {copied ? (
                <Check className="size-4 approval-check-passed" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          <Separator />

          <div className="funding-step">
            <div className="funding-step-head">
              <span className="funding-step-title">
                <span className="funding-step-number">1</span>
                Gas
              </span>
              <span
                className={`funding-balance ${needsGas ? "value-negative" : "value-positive"}`}
              >
                {gasAmount.toFixed(4)} {gasSymbol}
              </span>
            </div>
            <p className="funding-step-note">
              {needsGas
                ? "Empty. Paste the address above into a faucet — the app cannot mint this."
                : "Enough to transact."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={STT_FAUCET} target="_blank" rel="noreferrer">
                  Somnia faucet
                  <ExternalLink className="size-3" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={GOOGLE_FAUCET} target="_blank" rel="noreferrer">
                  Backup
                  <ExternalLink className="size-3" />
                </a>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="funding-step">
            <div className="funding-step-head">
              <span className="funding-step-title">
                <span className="funding-step-number">2</span>
                Collateral
              </span>
              <span
                className={`funding-balance ${
                  collateralAmount > 0 ? "value-positive" : "text-muted-foreground"
                }`}
              >
                {collateralAmount.toLocaleString()} USDC
              </span>
            </div>
            <p className="funding-step-note">
              {needsGas
                ? "Needs gas first — this mint is a transaction."
                : "Mints 10,000 test USDC from the venue's faucet."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={mintCollateral}
                disabled={needsGas || pending === "faucet"}
              >
                {pending === "faucet" ? "Minting..." : "Mint 10,000 test USDC"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <p className="funding-step-note">
              To see the balance in your wallet, import this token:
            </p>
            <div className="funding-address">
              <code className="funding-address-value">{TEST_USDC_SHANNON}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigator.clipboard?.writeText(TEST_USDC_SHANNON)}
                aria-label="Copy token address"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <a
              className="funding-link"
              href={`${EXPLORER}/address/${address}`}
              target="_blank"
              rel="noreferrer"
            >
              <Wallet className="size-3" />
              View on explorer
              <ExternalLink className="size-3" />
            </a>
            <Button variant="ghost" size="sm" onClick={refresh}>
              Refresh
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
