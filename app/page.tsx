"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, ChevronDown, Database, ExternalLink, FileCheck2, Menu, ShieldCheck, Sparkles, Wallet, X } from "lucide-react";
import { connectWallet, explorerUrl } from "@/lib/genlayer";
const stages=["Fund epoch","Challenge evidence","AI consensus","Settle GEN"];
const faqs=[
  ["Why does this need GenLayer?","Reserve reports contain legal scope, exceptions, custody language and conflicting disclosures that a numeric oracle cannot interpret safely. GenLayer validators independently ground the same bounded facts."],
  ["Is GEN actually held by the contract?","Yes. Opening and challenging an assessment are payable writes. The contract tracks deposited, held, paid and refunded wei and emits real transfers only after a terminal outcome."],
  ["What happens if evidence is unavailable?","The active assessment enters bounded recovery. After the locked deadline, each participant recovers its own bond, so no party can veto forever."],
  ["Can a capability be replayed?","No. Every capability binds one assessment, one consumer and one action. Consumption changes it permanently from ACTIVE to CONSUMED."],
];

export default function Home(){
  const [wallet,setWallet]=useState("");const[menu,setMenu]=useState(false);const[faq,setFaq]=useState(0);
  useEffect(()=>{const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("visible")),{threshold:.12});document.querySelectorAll(".reveal").forEach(el=>io.observe(el));return()=>io.disconnect();},[]);
  async function connect(){const r=await connectWallet();if(r.success)setWallet(String(r.data));}
  return <main>
    <header className="siteHeader"><Link className="brand" href="#top"><span className="brandMark"><ShieldCheck/></span><span>ReserveCovenant</span></Link>
      <nav className={menu?"nav open":"nav"}><a href="#product">Product</a><a href="#workflow">Workflow</a><Link href="/terminal">Terminal</Link><a href="#faq">FAQ</a></nav>
      <div className="headerActions"><a className="iconBtn" href={explorerUrl()} target="_blank" aria-label="Explorer"><ExternalLink/></a><button className="walletBtn" onClick={connect}><Wallet/>{wallet?`${wallet.slice(0,6)}…${wallet.slice(-4)}`:"Connect wallet"}</button><button className="menuBtn" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div>
    </header>

    <section id="top" className="hero"><div className="gridGlow"/><div className="eyebrow"><Sparkles/> GEN-backed reserve assurance</div>
      <h1>Make reserve claims<br/><span>answerable on-chain.</span></h1>
      <p>Independent evidence, semantic consensus and real GEN bonds turn stablecoin attestations into enforceable risk states.</p>
      <div className="heroCtas"><Link className="primaryBtn" href="/terminal">Open assessment <ArrowRight/></Link><a className="ghostBtn" href="#workflow">Explore the protocol</a></div>
      <div className="heroPanel reveal"><div className="panelTop"><span><Activity/> Illustrative outcome preview</span><span className="networkDot">Four bounded states</span></div>
        <div className="riskRows"><div><small>DEMOUSD / Epoch 14</small><strong className="healthy">HEALTHY</strong><span>4 covenants matched</span></div><div><small>RISKUSD / Epoch 08</small><strong className="restricted">RESTRICTED</strong><span>Material exception found</span></div><div><small>CONFLICTUSD / Epoch 03</small><strong className="watch">UNVERIFIABLE</strong><span>Recovery window active</span></div></div>
      </div>
    </section>

    <section id="product" className="section reveal"><div className="sectionTag">The product primitive</div><h2>More than a reserve dashboard.</h2><p className="lead">ReserveCovenant maintains persistent assessment epochs and converts source-grounded facts into economic and protocol consequences.</p>
      <div className="featureGrid"><article><Database/><h3>Versioned epochs</h3><p>Every assessment locks asset, epoch, evidence identifiers and deadlines before review.</p><div className="miniGraph"><i/><i/><i/><i/></div></article><article><FileCheck2/><h3>Cross-source facts</h3><p>Validators compare issuer and challenger evidence through independent gateways.</p><div className="factChips"><span>Coverage</span><span>Scope</span><span>Freshness</span><span>Exceptions</span></div></article><article><ShieldCheck/><h3>Bounded capabilities</h3><p>Settled risk states produce single-use actions for downstream DeFi integrations.</p><div className="capability">PAUSE_NEW_EXPOSURE <ArrowRight/></div></article></div>
    </section>

    <section id="workflow" className="section workflow reveal"><div className="workflowHeading"><div className="sectionTag">How it works</div><h2>Evidence becomes accountable capital.</h2></div><div className="stageLine">{stages.map((s,i)=><div key={s}><b>0{i+1}</b><span>{s}</span></div>)}</div>
      <div className="workflowCard"><div><small>Deterministic settlement bands</small><h3>The jury extracts facts.<br/>The contract moves value.</h3><p>HEALTHY rewards the issuer. RESTRICTED rewards a successful challenger. WATCH returns each bond. UNVERIFIABLE enters non-vetoable recovery.</p><Link href="/terminal">Run the flow <ArrowRight/></Link></div><div className="orbit"><span>GEN</span><i/><i/><i/><i/></div></div>
    </section>

    <section id="faq" className="section faq reveal"><div className="sectionTag">Protocol questions</div><h2>Built for scrutiny.</h2><div className="faqList">{faqs.map((item,i)=><button key={item[0]} onClick={()=>setFaq(faq===i?-1:i)} className={faq===i?"active":""}><span><b>{item[0]}</b>{faq===i&&<p>{item[1]}</p>}</span><ChevronDown/></button>)}</div></section>
    <section className="cta reveal"><ShieldCheck/><h2>Collateral truth needs consequences.</h2><p>Turn public reserve evidence into a state DeFi protocols can actually use.</p><Link className="primaryBtn" href="/terminal">Open an assessment <ArrowRight/></Link></section>
    <footer><div className="brand"><span className="brandMark"><ShieldCheck/></span><span>ReserveCovenant</span></div><p>GenLayer-native reserve assurance with real GEN custody.</p><span>Studionet · 2026</span></footer>
  </main>;
}
