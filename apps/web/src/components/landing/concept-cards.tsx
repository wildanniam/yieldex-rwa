import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { AskAssistant } from './interactions';
import deployment from '../../../../../deployments/sepolia.json';
import s from './concept-cards.module.css';

/** Original explanatory artwork. Labels remain HTML, not baked into an image. */
function BackingArtwork() {
  return (
    <svg
      viewBox="0 0 600 320"
      fill="none"
      aria-hidden="true"
      className={s.vaultArt}
    >
      <defs>
        <linearGradient
          id="yx-metal"
          x1="170"
          y1="70"
          x2="310"
          y2="275"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c6dfc9" />
          <stop offset=".23" stopColor="#5d7967" />
          <stop offset=".58" stopColor="#192c24" />
          <stop offset="1" stopColor="#829a81" />
        </linearGradient>
        <linearGradient
          id="yx-glass"
          x1="145"
          y1="125"
          x2="355"
          y2="275"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b5ebc3" stopOpacity=".22" />
          <stop offset=".55" stopColor="#86c891" stopOpacity=".03" />
          <stop offset="1" stopColor="#557d60" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id="yx-edge">
          <stop stopColor="#b7eab9" stopOpacity=".6" />
          <stop offset="1" stopColor="#6e9679" stopOpacity=".05" />
        </linearGradient>
        <radialGradient id="yx-pool">
          <stop stopColor="#8bebaa" stopOpacity=".22" />
          <stop offset="1" stopColor="#8bebaa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="yx-stream">
          <stop stopColor="#86c991" stopOpacity=".08" />
          <stop offset=".55" stopColor="#a4e6b1" />
          <stop offset="1" stopColor="#9383ee" />
        </linearGradient>
      </defs>
      <ellipse cx="258" cy="265" rx="209" ry="64" fill="url(#yx-pool)" />
      <path
        d="M66 256 255 172 450 254 257 340Z"
        fill="#0a1913"
        stroke="#334e3d"
      />
      <path
        d="M95 243 255 172 418 242 256 313Z"
        fill="#102119"
        stroke="#52755b"
        strokeOpacity=".6"
      />
      <path d="m115 250 142 62 139-61M257 314v23" stroke="#264330" />
      <g className={s.assetStack}>
        {[0, 1, 2].map((n) => (
          <g key={n} transform={`translate(0 ${-n * 23})`}>
            <path
              d="M182 192v20c0 24 125 24 125 0v-20"
              fill="url(#yx-metal)"
              stroke="#8bad90"
              strokeOpacity=".35"
            />
            <ellipse
              cx="244.5"
              cy="192"
              rx="62.5"
              ry="22"
              fill="#172f22"
              stroke="#a3c9aa"
              strokeOpacity=".65"
            />
            <ellipse
              cx="244.5"
              cy="191"
              rx="53"
              ry="16"
              stroke="#87b492"
              strokeOpacity=".3"
            />
            <path
              d="m232 199 12-16 13 16m-19-5h14"
              stroke="#bde5c2"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
      <path
        d="m151 132 105 41 101-44-103-40Z"
        fill="url(#yx-glass)"
        stroke="url(#yx-edge)"
      />
      <path
        d="m151 132 105 41v122l-105-46Z"
        fill="url(#yx-glass)"
        stroke="url(#yx-edge)"
      />
      <path
        d="m256 173 101-44v119l-101 47Z"
        fill="url(#yx-glass)"
        stroke="url(#yx-edge)"
      />
      <path d="m165 145 77 31v101" stroke="#daffe2" strokeOpacity=".24" />
      <g transform="translate(278 210) skewY(-23)">
        <rect
          width="27"
          height="24"
          rx="6"
          fill="#9edaac"
          fillOpacity=".15"
          stroke="#a4d7b1"
        />
        <path
          d="M7 0v-7a6.5 6.5 0 0 1 13 0v7m-7 9v7"
          stroke="#c1ecd0"
          strokeWidth="2"
        />
      </g>
      <path
        d="M310 109C358 60 370 211 452 147"
        stroke="url(#yx-stream)"
        strokeWidth="1.5"
      />
      <path
        d="M314 119C364 73 376 221 458 157"
        stroke="url(#yx-stream)"
        strokeOpacity=".2"
      />
      <g className={s.incomeTokens}>
        {[0, 1, 2].map((n) => (
          <g
            key={n}
            transform={`translate(${381 + n * 29} ${109 + n * 7}) rotate(-24)`}
          >
            <ellipse
              rx="15"
              ry="21"
              fill="#243830"
              stroke="#a3d8b1"
              strokeOpacity=".65"
            />
            <ellipse rx="10" ry="16" stroke="#9fcdac" strokeOpacity=".25" />
            <path d="M-4-5 0 0l4-5M0 0v7" stroke="#c3e9c8" strokeWidth="2" />
          </g>
        ))}
      </g>
      <circle cx="456" cy="149" r="3" fill="#b2a5ff" />
      <path
        d="M67 301h28m-14-14v28M481 228h20m-10-10v20"
        stroke="#80a589"
        strokeOpacity=".22"
      />
    </svg>
  );
}

function OfferArtwork() {
  return (
    <div
      className={s.offerScene}
      aria-label="Example offer: 50 percent income for six months, priced at 90 DemoUSD"
    >
      <div className={s.ticketBack} aria-hidden="true" />
      <div className={s.ticket}>
        <div className={s.ticketHeading}>
          <span className={s.assetMark}>A</span>
          <span>
            demoAAPL<small>INCOME RIGHTS</small>
          </span>
          <Icon name="arrow-up-right" size={18} alt="" inheritColor />
        </div>
        <div className={s.ticketTerms}>
          <div>
            <small>Income share</small>
            <strong>
              50<span>%</span>
            </strong>
          </div>
          <div>
            <small>Term at purchase</small>
            <strong>
              6<span>months</span>
            </strong>
          </div>
        </div>
        <div className={s.ticketPerforation} />
        <div className={s.ticketPrice}>
          <span>Fixed upfront price</span>
          <strong>
            90 <small>DemoUSD</small>
          </strong>
        </div>
        <div className={s.barcode} aria-hidden="true" />
        <span className={s.ticketSerial}>YLX / ILLUSTRATIVE OFFER</span>
      </div>
      <span className={s.offerSeal}>
        <Icon name="lock" size={14} alt="" inheritColor /> Backing locked
      </span>
    </div>
  );
}

function ResaleArtwork() {
  return (
    <div
      className={s.resaleScene}
      aria-label="The whole income position moves from Bob to Carol; its original expiry stays unchanged"
    >
      <div className={s.transferRail} aria-hidden="true">
        <span>B</span>
        <i />
        <span>C</span>
      </div>
      <div className={s.rightPass}>
        <div>
          <Icon name="receipt" size={18} alt="" inheritColor />
          <span>INCOME POSITION</span>
        </div>
        <strong>One whole right.</strong>
        <small>New holder. Same terms.</small>
        <div className={s.passFooter}>
          <span>BOB</span>
          <Icon name="arrow-right" size={16} alt="" inheritColor />
          <span>CAROL</span>
        </div>
      </div>
      <div className={s.expiryRail}>
        <span>Purchased</span>
        <i />
        <span>
          <Icon name="lock" size={12} alt="" inheritColor /> Original expiry
        </span>
      </div>
      <div className={s.keptClaim}>
        <Icon name="coins" size={14} alt="" inheritColor /> Earned claims stay
        with Bob
      </div>
    </div>
  );
}

function AssistantArtwork() {
  return (
    <div
      className={s.assistantScene}
      aria-label="AI organizes offer terms and risks for you to review"
    >
      <div className={s.orbit} aria-hidden="true" />
      <div className={s.aiCore} aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient
              id="yx-ai"
              x1="20"
              y1="10"
              x2="80"
              y2="90"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#e1daff" />
              <stop offset=".5" stopColor="#9989ee" />
              <stop offset="1" stopColor="#423479" />
            </linearGradient>
          </defs>
          <path
            d="m50 8 12 29 30 13-30 12-12 30-13-30L8 50l29-13Z"
            fill="url(#yx-ai)"
            stroke="#d5cdff"
            strokeOpacity=".7"
          />
          <path
            d="m50 8 0 42 42 0M8 50h42v42M37 37l13 13 12-13M37 62l13-12 12 12"
            stroke="#24183f"
            strokeOpacity=".45"
          />
        </svg>
      </div>
      <div className={`${s.insight} ${s.insightA}`}>
        <Icon name="layers" size={16} alt="" inheritColor />
        <span>
          Income share<strong>50% for 6 months</strong>
        </span>
      </div>
      <div className={`${s.insight} ${s.insightB}`}>
        <Icon name="shield-check" size={16} alt="" inheritColor />
        <span>
          Principal<strong>Stays with the seller</strong>
        </span>
      </div>
      <div className={`${s.insight} ${s.insightC}`}>
        <Icon name="info" size={16} alt="" inheritColor />
        <span>
          Know the risk<strong>Income can be zero</strong>
        </span>
      </div>
      <span className={s.aiSceneCaption}>
        Illustrative explanation · You decide
      </span>
    </div>
  );
}

export function ConceptCards() {
  return (
    <div className={s.grid}>
      <article data-landing-reveal className={`${s.card} ${s.principal}`}>
        <div className={s.copy}>
          <span className={s.kicker}>OWNERSHIP, UNBUNDLED</span>
          <h3>
            Your assets stay.
            <br />
            <em>The income can move.</em>
          </h3>
          <p>
            Sell a share of future income for an upfront payment. Keep ownership
            of the backing locked in your vault.
          </p>
        </div>
        <div className={s.backingScene}>
          <BackingArtwork />
          <div className={s.backingLabel}>
            <span>YOUR BACKING</span>
            <strong>
              100 <small>demoAAPL</small>
            </strong>
          </div>
          <div className={s.incomeLabel}>
            <span>BUYER’S RIGHT</span>
            <strong>
              50% <small>of income</small>
            </strong>
          </div>
        </div>
        <div className={s.cardFooter}>
          <span>Illustrative split · No principal sale</span>
          <Link href="#calculator" aria-label="Explore the income example">
            <Icon name="arrow-up-right" size={20} alt="" inheritColor />
          </Link>
        </div>
      </article>
      <article data-landing-reveal className={`${s.card} ${s.offer}`}>
        <div className={s.copy}>
          <span className={s.kicker}>SET THE TERMS</span>
          <h3>
            One offer.
            <br />
            <em>Entirely on your terms.</em>
          </h3>
          <p>
            Your share, your price, your period. The term begins when a buyer
            accepts.
          </p>
        </div>
        <OfferArtwork />
        <Link className={s.textLink} href="/lab">
          Create an offer in the demo{' '}
          <Icon name="arrow-up-right" size={16} alt="" inheritColor />
        </Link>
      </article>
      <article data-landing-reveal className={`${s.card} ${s.resale}`}>
        <ResaleArtwork />
        <div className={s.copy}>
          <span className={s.kicker}>A RIGHT THAT TRAVELS</span>
          <h3>
            Change hands.
            <br />
            <em>Keep the deadline.</em>
          </h3>
          <p>
            Resell the whole position while it’s active. Its original expiry
            stays; already-earned claims remain yours.
          </p>
        </div>
      </article>
      <article
        id="assistant"
        data-landing-reveal
        className={`${s.card} ${s.assistant}`}
      >
        <AssistantArtwork />
        <div className={s.aiBottom}>
          <div className={s.copy}>
            <span className={s.kicker}>CLARITY BEFORE COMMITMENT</span>
            <h3>
              Read between
              <br />
              <em>the numbers.</em>
            </h3>
            <p>
              Find offers, understand the terms and compare token quotes with
              Yieldex AI.
            </p>
          </div>
          <AskAssistant compact>Ask Yieldex</AskAssistant>
        </div>
        <span className={s.aiNote}>
          Read-only quotes. No automatic swaps. Your wallet confirms.
        </span>
      </article>
      <div data-landing-reveal className={s.proof}>
        <div className={s.proofTrack} aria-hidden="true">
          <span />
          <i />
          <span />
          <i />
          <span />
        </div>
        <div>
          <strong>Onchain. Open to inspect.</strong>
          <p>Backing, positions and claims recorded in smart contracts.</p>
        </div>
        <a
          href={`https://sepolia.etherscan.io/address/${deployment.market}`}
          target="_blank"
          rel="noreferrer"
        >
          <span>SEPOLIA MARKET</span>
          <code>
            {deployment.market.slice(0, 8)}…{deployment.market.slice(-4)}
          </code>
          <Icon name="external-link" size={16} alt="" inheritColor />
        </a>
      </div>
    </div>
  );
}
