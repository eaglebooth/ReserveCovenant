import { createClient } from "genlayer-js";
import { localnet, studionet, testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

type NetworkName = "localnet" | "studionet" | "testnetBradbury";
declare global { interface Window { ethereum?: { request:(args:{method:string;params?:unknown[]})=>Promise<unknown> } } }
const network = (process.env.NEXT_PUBLIC_NETWORK as NetworkName) || "studionet";
const chains = { localnet, studionet, testnetBradbury };
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC;
const readClient = createClient({chain:chains[network] ?? studionet,...(endpoint?{endpoint}:{})});
type RuntimeClient = {
  connect?:(name:NetworkName)=>Promise<unknown>;
  readContract:(args:{address:string;functionName:string;args:unknown[]})=>Promise<unknown>;
  writeContract:(args:{address:string;functionName:string;args:unknown[];value:bigint})=>Promise<string|{txId:string}>;
  waitForTransactionReceipt:(args:{hash:`0x${string}`;status:string;interval?:number;retries?:number})=>Promise<Record<string,unknown>>;
  getTransaction:(args:{hash:`0x${string}`})=>Promise<Record<string,unknown>>;
};
export type Result={success:boolean;data?:unknown;hash?:string;status?:string;error?:string};
export const contractAddress=()=>process.env.NEXT_PUBLIC_CONTRACT_ADDRESS||"";
export const explorerUrl=()=>`${process.env.NEXT_PUBLIC_EXPLORER_BASE||"https://explorer-studio.genlayer.com/address/"}${contractAddress()}`;
export async function connectWallet():Promise<Result>{
  if(!window.ethereum)return{success:false,error:"Install or unlock an EVM wallet."};
  try{const accounts=await window.ethereum.request({method:"eth_requestAccounts"}) as string[];return accounts[0]?{success:true,data:accounts[0]}:{success:false,error:"No account selected."};}
  catch(error){return{success:false,error:error instanceof Error?error.message:"Wallet connection failed."};}
}
export async function readContract(functionName:string,args:unknown[]=[]):Promise<Result>{
  if(!contractAddress()||contractAddress().endsWith("0000000000000000000000000000000000000000"))return{success:false,error:"Deploy and configure the contract first."};
  try{return{success:true,data:await(readClient as unknown as RuntimeClient).readContract({address:contractAddress(),functionName,args})};}
  catch(error){return{success:false,error:error instanceof Error?error.message:"Contract read failed."};}
}
export async function writeContract(functionName:string,args:unknown[]=[],value=BigInt(0)):Promise<Result>{
  if(!window.ethereum)return{success:false,error:"Connect a wallet before writing."};
  if(!contractAddress()||contractAddress().endsWith("0000000000000000000000000000000000000000"))return{success:false,error:"Deploy and configure the contract first."};
  let hash="";
  try{
    const accounts=await window.ethereum.request({method:"eth_requestAccounts"}) as string[];
    const client=createClient({chain:chains[network]??studionet,...(endpoint?{endpoint}:{}),provider:window.ethereum,account:accounts[0] as `0x${string}`}) as unknown as RuntimeClient;
    if(client.connect)await client.connect(network);
    const raw=await client.writeContract({address:contractAddress(),functionName,args,value});
    hash=typeof raw==="string"?raw:raw.txId;
    const receipt=await client.waitForTransactionReceipt({hash:hash as `0x${string}`,status:TransactionStatus.ACCEPTED,interval:2000,retries:100});
    let observed=receipt;try{observed=await client.getTransaction({hash:hash as `0x${string}`});}catch{}
    const execution=String(observed.txExecutionResultName||receipt.txExecutionResultName||"");
    if(["FINISHED_WITH_ERROR","FAILED"].includes(execution))return{success:false,hash,error:"Contract rejected this action. Inspect the transaction payload."};
    return{success:true,hash,status:String(observed.statusName||receipt.statusName||"ACCEPTED"),data:receipt};
  }catch(error){return{success:false,hash,error:error instanceof Error?error.message:"Contract write failed."};}
}
export function unwrap<T>(value:unknown):T|null{try{if(typeof value==="string")return JSON.parse(value) as T;if(value&&typeof value==="object"&&"result" in value)return unwrap<T>((value as {result:unknown}).result);return value as T;}catch{return null;}}
