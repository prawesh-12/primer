/**
 * Original commentary written for this edition.
 *
 * Every other word on this site is Donne Martin's, reproduced verbatim —
 * `scripts/verify-fidelity.mjs` fails the build if a single line of the primer
 * is dropped or invented, which is exactly why this file exists outside
 * `content/`.  The primer explains what the pieces are; it does not say how
 * each one is examined in an interview, and that is the gap these notes fill.
 *
 * Two rules for anything added here.  It has to be something a reader could
 * not get from the chapter above it, and it has to be specific enough to be
 * wrong — "say what breaks before you shard" is a claim; "consider your
 * requirements carefully" is filler.
 */

export interface CommentaryPoint {
  /** The lead-in, set in the reader's eye as the claim being made. */
  term: string;
  detail: string;
}

export interface Commentary {
  /** Rendered as the section's <h2>, and added to the table of contents. */
  heading: string;
  body: string[];
  points: CommentaryPoint[];
  related?: { route: string; label: string }[];
}

export const COMMENTARY_ANCHOR = 'interview-notes';

export const COMMENTARY: Record<string, Commentary> = {
  /* ------------------------------------------------------- getting started */

  '/getting-started/motivation': {
    heading: 'How to use this guide',
    body: [
      'The primer is a reference, not a syllabus. It was written to be dipped into, and reading it front to back is the slowest way to prepare — most people get more out of attempting a design first and reading the relevant chapter afterwards, when they can feel the gap the chapter fills.',
    ],
    points: [
      {
        term: 'Read in two passes',
        detail:
          'First pass, the fundamentals only, enough to name a trade-off out loud. Second pass, the building blocks on demand, as the case studies expose what you are missing.',
      },
      {
        term: 'Attempt before you read',
        detail:
          'Try a case study cold against a 45-minute timer, then compare. What you failed to consider is your reading list.',
      },
      {
        term: 'Do not memorise designs',
        detail:
          'An interviewer changes one constraint and the memorised answer collapses. Learn which constraint drives which decision instead.',
      },
    ],
    related: [
      { route: '/getting-started/study-guide', label: 'Plan your study time' },
      {
        route: '/getting-started/how-to-approach-a-system-design-interview-question',
        label: 'The four step interview method',
      },
    ],
  },

  '/getting-started/index-of-system-design-topics': {
    heading: 'Using the index as a checklist',
    body: [
      'This index is more useful after a mock interview than before one. Run through it once you already have a design on the board and it stops being a table of contents: every entry becomes something you either used, ruled out, or forgot.',
    ],
    points: [
      {
        term: 'Ruling something out scores',
        detail:
          '"No CDN here, the payload is per-user" earns the same credit as using one. Saying nothing about it earns nothing.',
      },
      {
        term: 'Walk it by layer',
        detail:
          'Client, edge, application, data, async. Interviewers follow the request path, so following it yourself is what stops you skipping a tier.',
      },
      {
        term: 'Depth beats breadth',
        detail: 'Two components you can take three questions deep is a better round than ten you can name.',
      },
    ],
    related: [
      { route: '/hld/start-here', label: 'Start on the HLD fundamentals' },
      {
        route: '/getting-started/how-to-approach-a-system-design-interview-question',
        label: 'How to run the interview itself',
      },
    ],
  },

  '/getting-started/study-guide': {
    heading: 'Turning the plan into a schedule',
    body: [
      'The study guide sets scope by how long you have. What it leaves open is cadence, and cadence is what decides whether any of it survives to the interview. Spaced practice wins: a design attempted, reviewed, and re-attempted a week later sticks in a way that a single long weekend never does.',
    ],
    points: [
      {
        term: 'Timebox every attempt',
        detail:
          '45 minutes, then stop. Running long hides the fact that you cannot finish in the time you will actually be given, which is part of what is being graded.',
      },
      {
        term: 'Write it, do not think it',
        detail:
          'Prose in a document or boxes on paper. An unwritten design always feels more complete than it is.',
      },
      {
        term: 'Keep an error log',
        detail:
          'One line per mistake per attempt. By the fourth entry the pattern is obvious, and it is usually the same omission every time.',
      },
    ],
    related: [
      { route: '/hld/case-studies', label: 'Work through the case studies' },
      {
        route: '/getting-started/how-to-approach-a-system-design-interview-question',
        label: 'Budget the 45 minutes',
      },
    ],
  },

  '/getting-started/how-to-approach-a-system-design-interview-question': {
    heading: 'A time budget for the 45 minute round',
    body: [
      'The four steps are the right shape. The failure mode is spending twenty-five minutes inside step one — almost everyone who runs out of time does so because requirements gathering had no stopping rule. These are the splits worth rehearsing against a timer.',
    ],
    points: [
      {
        term: '5 min — requirements',
        detail:
          'Two or three use cases, agreed out loud, then stop. Write them where you can see them and point back at them when scope creeps.',
      },
      {
        term: '5 min — estimates',
        detail:
          'Traffic, storage, bandwidth. Round hard. The number matters far less than showing you can bound the problem before designing for it.',
      },
      {
        term: '15 min — high level design',
        detail: 'Boxes and arrows for the happy path, end to end, before any deep dive. Get to a whole system early.',
      },
      {
        term: '20 min — deep dive and scale',
        detail:
          'Take the bottleneck your own estimate exposed, not the component you find most interesting.',
      },
    ],
    related: [
      { route: '/reference/powers-of-two-table', label: 'Numbers for the estimate step' },
      { route: '/hld/case-studies', label: 'Practise the whole loop' },
    ],
  },

  /* ------------------------------------------------------ HLD fundamentals */

  '/hld/start-here': {
    heading: 'What the fundamentals are for',
    body: [
      'These chapters exist so you can name a trade-off instead of gesturing at one. Nearly every good answer eventually reduces to the same sentence — "I am trading X for Y here, because the requirement says Z" — and the vocabulary for X and Y comes from this group.',
    ],
    points: [
      {
        term: 'There is no correct architecture',
        detail: 'There is a defensible one, defended against a requirement you stated earlier. That is the whole game.',
      },
      {
        term: 'Learn the pairs',
        detail:
          'Performance and scalability, latency and throughput, availability and consistency. Each is a question an interviewer can ask you verbatim.',
      },
      {
        term: 'State the requirement first',
        detail:
          '"Reads have to be fresh within a second" makes the next ten decisions obvious, and shows you are designing rather than reciting.',
      },
    ],
    related: [
      { route: '/hld/availability-vs-consistency', label: 'The pair that decides most designs' },
      { route: '/hld/case-studies', label: 'See them applied end to end' },
    ],
  },

  '/hld/performance-vs-scalability': {
    heading: 'The distinction interviewers probe for',
    body: [
      'The question hiding behind this pair is diagnostic: given a system that is slow, can you tell whether it is slow for one user or slow because there are many? The two have unrelated fixes, and reaching for the wrong one is a visible error.',
    ],
    points: [
      {
        term: 'Slow at one user is a performance problem',
        detail: 'A bad query plan, an N+1, a synchronous call that should not be. Adding machines does nothing for it.',
      },
      {
        term: 'Slow only under load is a scaling problem',
        detail: 'Contention, a shared bottleneck, a queue that never drains. Profile before you shard.',
      },
      {
        term: 'Name the symptom precisely',
        detail:
          '"p99 degrades above 2k RPS while p50 holds" is a scaling story. "p50 is 800 ms at any load" is not, and no amount of horizontal scaling will help it.',
      },
    ],
    related: [
      { route: '/hld/latency-vs-throughput', label: 'The other half of the vocabulary' },
      { route: '/hld/load-balancer', label: 'Where horizontal scaling starts' },
    ],
  },

  '/hld/latency-vs-throughput': {
    heading: 'Where this pair decides a design',
    body: [
      'These two get traded against each other constantly, most visibly by batching: a bigger batch raises throughput and raises latency in the same move. What an interviewer listens for is whether you say which one the requirement cares about before you start tuning either.',
    ],
    points: [
      {
        term: 'Batching and buffering',
        detail: 'Raise throughput, cost latency. Correct for an analytics pipeline, wrong for a checkout path.',
      },
      {
        term: 'A queue absorbs bursts, not overload',
        detail:
          'If the consumer is saturated the queue converts backlog straight into latency. Say what happens when it fills.',
      },
      {
        term: 'Quote percentiles, not averages',
        detail: 'The average hides the tail. p99 is what users feel and what SLOs get written against.',
      },
    ],
    related: [
      { route: '/hld/asynchronism', label: 'Moving work off the request path' },
      { route: '/reference/latency-numbers-every-programmer-should-know', label: 'The numbers to reason with' },
    ],
  },

  '/hld/availability-vs-consistency': {
    heading: 'Using CAP without being caught out',
    body: [
      'The trap in CAP is stating it as a permanent three-way choice. A partition is an event, not a setting: the system is consistent and available while the network is healthy, and only has to choose during a partition. Saying that out loud separates you from a candidate reciting the acronym.',
    ],
    points: [
      {
        term: 'Choose per operation, not per system',
        detail:
          'A payment write can be CP and the profile page that reads it AP, inside the same product. Interviewers like this answer because it is what real systems do.',
      },
      {
        term: 'CP costs availability, not correctness',
        detail: 'A CP system rejects or blocks during a partition. It does not hand back wrong data.',
      },
      {
        term: 'AP costs freshness',
        detail:
          'An AP system answers from a possibly stale replica. Name the staleness window the product can live with and the decision defends itself.',
      },
    ],
    related: [
      { route: '/hld/consistency-patterns', label: 'The three patterns in detail' },
      { route: '/hld/availability-patterns', label: 'Failover and replication' },
    ],
  },

  '/hld/consistency-patterns': {
    heading: 'Picking the pattern from the requirement',
    body: [
      'The three patterns map cleanly onto things a product person would say, and the interviewer is usually testing whether you can do that mapping out loud rather than whether you can define the terms.',
    ],
    points: [
      {
        term: '"It is fine if it is a bit behind"',
        detail: 'Eventual consistency. Feeds, view counters, search indexes, analytics dashboards.',
      },
      {
        term: '"The user must see their own write"',
        detail:
          'Read-your-writes. Usually bought by pinning that user’s reads to the primary, or to a session, for a short window.',
      },
      {
        term: '"Two people must never both get the last one"',
        detail:
          'Strong consistency, and you should name the latency and availability it costs in the same breath.',
      },
    ],
    related: [
      { route: '/hld/database', label: 'Where the guarantee is actually enforced' },
      { route: '/hld/cache', label: 'The layer that quietly breaks it' },
    ],
  },

  '/hld/availability-patterns': {
    heading: 'The arithmetic behind the nines',
    body: [
      'Failover and replication are the mechanisms. The part candidates skip is what availability multiplies out to: components in sequence multiply their availabilities, so a request path through four 99.9% services is 99.6% available — worse than any single piece of it.',
    ],
    points: [
      {
        term: 'In sequence, availability multiplies',
        detail:
          'More synchronous hops means less available. This is the real argument for cutting dependencies out of the request path.',
      },
      {
        term: 'In parallel, unavailability multiplies',
        detail: 'Two redundant 99.9% components give you 99.9999%. This is the argument for replicas.',
      },
      {
        term: 'Failover is not free',
        detail:
          'Active-passive can lose data in flight during the switch; active-active needs a write path that tolerates two masters. Say which you are buying.',
      },
    ],
    related: [
      { route: '/hld/availability-vs-consistency', label: 'What you give up for it' },
      { route: '/hld/load-balancer', label: 'Where health checks decide availability' },
    ],
  },

  /* ----------------------------------------------------- HLD building blocks */

  '/hld/domain-name-system': {
    heading: 'Where DNS shows up in an answer',
    body: [
      'DNS rarely carries an interview by itself, but it is the first hop of every request and the cheapest place to do geographic routing. It is worth thirty seconds at the top of a design, and worth knowing why its TTLs make it a poor failover mechanism.',
    ],
    points: [
      {
        term: 'TTL cuts both ways',
        detail:
          'A long TTL saves lookup latency and means a failover can take as long as the TTL to propagate. That is why DNS is a routing tool, not a failover tool.',
      },
      {
        term: 'Routing policies are a design lever',
        detail:
          'Latency-based and geo routing put a user on a nearby region with no application code at all. Cheap to mention, and often the right first answer to "how do we serve Europe?"',
      },
      {
        term: 'It is a dependency you can lose',
        detail:
          'A DNS outage takes the site down with every server healthy. Worth one sentence when the discussion turns to failure modes.',
      },
    ],
    related: [
      { route: '/hld/content-delivery-network', label: 'The next hop out at the edge' },
      { route: '/hld/load-balancer', label: 'Where real failover lives' },
    ],
  },

  '/hld/content-delivery-network': {
    heading: 'Deciding push against pull',
    body: [
      'The choice is driven by catalogue size and change rate, and that is what an interviewer wants reasoned rather than recited. Pull is the default because it needs no coordination; push only earns its keep when the origin cannot absorb the first request in each region.',
    ],
    points: [
      {
        term: 'Pull',
        detail:
          'The origin fills the edge on first miss. Simple, self-healing, and pays a cold-miss penalty once per region per object.',
      },
      {
        term: 'Push',
        detail:
          'You upload ahead of demand. Right for a small, hot, rarely-changing set; wasteful across a long tail nobody requests.',
      },
      {
        term: 'Invalidation is the hard part',
        detail:
          'Versioned or content-hashed URLs sidestep it completely, and are almost always a better answer than purging the edge.',
      },
    ],
    related: [
      { route: '/hld/cache', label: 'The same problems one layer in' },
      { route: '/hld/domain-name-system', label: 'How users reach the nearest edge' },
    ],
  },

  '/hld/load-balancer': {
    heading: 'What to say after "round robin"',
    body: [
      'Naming an algorithm is the low bar and every candidate clears it. The answers that stand out are about what the balancer does to state and to failure: where session data lives, how health checks decide who gets traffic, and what layer 7 buys that is worth terminating TLS for.',
    ],
    points: [
      {
        term: 'L4 or L7, and say which',
        detail:
          'Layer 4 routes on address and port and is cheap. Layer 7 reads the request and can route by path, host, or header — which is what you need for canaries and per-service routing.',
      },
      {
        term: 'Sticky sessions are a trap',
        detail:
          'They are the easy answer and they break rebalancing and draining. Externalising session state is nearly always the better one.',
      },
      {
        term: 'Health checks define availability',
        detail:
          'An instance that has lost its database but still answers a shallow TCP check keeps taking traffic. Deep checks are what make the redundancy real.',
      },
    ],
    related: [
      { route: '/hld/reverse-proxy-web-server', label: 'The component it is confused with' },
      { route: '/hld/availability-patterns', label: 'The arithmetic it is buying' },
    ],
  },

  '/hld/reverse-proxy-web-server': {
    heading: 'Reverse proxy or load balancer?',
    body: [
      'This is a standard follow-up and "they are the same thing" is the wrong answer. A load balancer exists to spread traffic across many equivalent backends; a reverse proxy exists to present one public face over what may be a single backend. The implementations overlap heavily and the intent does not.',
    ],
    points: [
      {
        term: 'One backend still justifies a proxy',
        detail:
          'TLS termination, compression, response caching, and request filtering are worth it before any balancing is involved.',
      },
      {
        term: 'It is a security boundary',
        detail: 'The proxy is the thing the internet talks to. The application server never is.',
      },
      {
        term: 'It is another hop that can fail',
        detail: 'It needs its own redundancy, or you have carefully moved the single point of failure one step outward.',
      },
    ],
    related: [
      { route: '/hld/load-balancer', label: 'The distribution half of the job' },
      { route: '/hld/security', label: 'What the boundary is for' },
    ],
  },

  '/hld/application-layer': {
    heading: 'The question hiding under microservices',
    body: [
      'Splitting the web tier from the application tier is a scaling argument rather than a fashion one: the two have different resource profiles and different scaling curves. Interviewers usually push from here into where service boundaries go, which is where most answers turn vague.',
    ],
    points: [
      {
        term: 'Split on scaling profile',
        detail:
          'An image resizer is CPU-bound and bursty; the API that calls it is neither. That is a real boundary with a real justification.',
      },
      {
        term: 'Do not split on the org chart',
        detail:
          'Services drawn around teams tend to need constant synchronous chatter, and every hop costs you availability.',
      },
      {
        term: 'Service discovery is part of the design',
        detail: 'Once there are N services, how they find each other is a decision you should make out loud, not a detail.',
      },
    ],
    related: [
      { route: '/hld/communication', label: 'How the services talk' },
      { route: '/hld/asynchronism', label: 'How to stop them talking synchronously' },
    ],
  },

  '/hld/database': {
    heading: 'Choosing SQL or NoSQL out loud',
    body: [
      'Interviewers are not looking for a preference here, they are looking for the access pattern that justifies one. The strongest answers start from the queries the product needs and arrive at a store; the weakest start at the store and work backwards.',
    ],
    points: [
      {
        term: 'Start from the queries',
        detail:
          '"Look up by user id, ordered by time, most recent fifty" points somewhere very different from "arbitrary joins across five entities". Say the query, then pick.',
      },
      {
        term: 'Relational until it hurts',
        detail:
          'One Postgres with read replicas carries most designs a long way. Say what specifically breaks before you reach for sharding.',
      },
      {
        term: 'Sharding changes the application',
        detail:
          'Cross-shard joins and transactions largely stop existing. That cost belongs in your answer, not in a footnote.',
      },
      {
        term: 'Denormalise deliberately',
        detail:
          'Trading write amplification for read speed is a fine decision. Doing it without noticing is how the write path becomes the bottleneck.',
      },
    ],
    related: [
      { route: '/hld/consistency-patterns', label: 'The guarantee you are choosing' },
      { route: '/hld/cache', label: 'The layer in front of it' },
    ],
  },

  '/hld/cache': {
    heading: 'The parts of caching that get probed',
    body: [
      'Where to cache is the easy half and most candidates cover it. The follow-ups that separate answers are about writes and about failure: what happens on invalidation, and what happens the moment the cache is empty or gone.',
    ],
    points: [
      {
        term: 'Cache-aside is the default',
        detail:
          'The application reads through and populates on miss. Simple, and the stale-write race it allows is worth naming before you are asked.',
      },
      {
        term: 'Write-through against write-behind',
        detail:
          'Write-through keeps cache and store aligned at the cost of write latency. Write-behind is faster and can lose data on failure. Pick against the requirement.',
      },
      {
        term: 'A cold cache is an outage',
        detail:
          'A flushed cache can take the database down behind it. Warming, and coalescing duplicate concurrent misses, are the answers.',
      },
      {
        term: 'TTL is a correctness decision',
        detail: 'It is the staleness window you agreed to when you chose a consistency model, expressed in seconds.',
      },
    ],
    related: [
      { route: '/hld/consistency-patterns', label: 'What the TTL is really choosing' },
      { route: '/lld/lru-cache', label: 'Build the eviction policy' },
    ],
  },

  '/hld/asynchronism': {
    heading: 'What moving work off the request path costs',
    body: [
      'Queues are the standard answer to slow work, and the standard follow-up is what the user sees while the work is pending. A design that returns 202 and never explains how the result gets back to the client is not finished.',
    ],
    points: [
      {
        term: 'Say how the result returns',
        detail: 'Polling, a webhook, or a push over an open socket. Pick one and justify it; do not leave it implied.',
      },
      {
        term: 'Retries demand idempotency',
        detail:
          'At-least-once delivery is the norm, so a consumer has to tolerate duplicates. An idempotency key on the request is the usual answer.',
      },
      {
        term: 'Back pressure is part of the design',
        detail:
          'Say what happens when producers outrun consumers: a bounded queue, load shedding, or a dead-letter queue. "It scales" is not an answer.',
      },
    ],
    related: [
      { route: '/hld/latency-vs-throughput', label: 'The trade you are making' },
      { route: '/hld/communication', label: 'How the result travels back' },
    ],
  },

  '/hld/communication': {
    heading: 'Picking a protocol on purpose',
    body: [
      'Most designs default to REST over HTTP and most of the time that is correct, so the interesting part of this chapter is knowing when it is not. The questions that decide it are who initiates, how often, and whether a dropped message is acceptable.',
    ],
    points: [
      {
        term: 'TCP or UDP',
        detail:
          'UDP where loss beats delay — telemetry, live audio and video, game state. TCP everywhere else. Say which and why in one sentence.',
      },
      {
        term: 'Server-initiated needs naming',
        detail:
          'Long polling, server-sent events, or WebSockets. They have very different costs at the edge once connections are held open at scale.',
      },
      {
        term: 'REST against RPC',
        detail:
          'REST gives uniform, cacheable resources and suits a public API. RPC gives tight action-shaped calls and usually wins service to service.',
      },
    ],
    related: [
      { route: '/hld/application-layer', label: 'Who is doing the talking' },
      { route: '/hld/asynchronism', label: 'When not to talk synchronously at all' },
    ],
  },

  '/hld/security': {
    heading: 'Enough security to not lose points',
    body: [
      'Security is rarely the subject of a system design round and is frequently the thing whose absence gets noticed. One sentence in the right place is usually all that is wanted, and omitting it reads as a blind spot.',
    ],
    points: [
      {
        term: 'Say it at the boundary',
        detail:
          'TLS in transit, encryption at rest, and validation of every input at the point it enters the system. Ten seconds, and it is covered.',
      },
      {
        term: 'Least privilege on the data path',
        detail: 'The service that reads a table should not hold credentials that can drop it.',
      },
      {
        term: 'Do not invent your own',
        detail:
          'For authentication, password hashing, or anything cryptographic, naming an established mechanism is the correct and expected answer.',
      },
    ],
    related: [
      { route: '/hld/reverse-proxy-web-server', label: 'Where the boundary sits' },
      { route: '/hld/communication', label: 'What is crossing it' },
    ],
  },

  /* --------------------------------------------------------- HLD case studies */

  '/hld/case-studies': {
    heading: 'How to work through a case study',
    body: [
      'These read as finished designs, which is exactly how they should not be studied. The value is in the gap between what you produce cold and what the solution does — and that gap only exists if you attempt it first.',
    ],
    points: [
      {
        term: 'Attempt cold, 45 minutes',
        detail:
          'No notes, no peeking. Stop at the timer even if you are unfinished; where you ran out is itself the diagnosis.',
      },
      {
        term: 'Diff, do not read',
        detail:
          'List every decision the solution makes that you did not, and write down the constraint that forced it. That list is the lesson.',
      },
      {
        term: 'Re-attempt a week later',
        detail: 'The second attempt is the one that tells you whether anything stuck.',
      },
      {
        term: 'Then change one constraint',
        detail:
          'Ten times the traffic, or strong consistency required, and see whether your design survives it. This is what an interviewer does.',
      },
    ],
    related: [
      {
        route: '/getting-started/how-to-approach-a-system-design-interview-question',
        label: 'The method to apply',
      },
      { route: '/hld/case-studies/pastebin', label: 'Start with the smallest one' },
    ],
  },

  '/hld/case-studies/pastebin': {
    heading: 'What this question is really testing',
    body: [
      'Pastebin is the standard opener because it is small enough to actually finish, while still containing one genuine design decision: how keys get generated. Nearly everything else is scaffolding an interviewer wants to see you put up quickly, so there is time to talk about the interesting part.',
    ],
    points: [
      {
        term: 'Key generation is the crux',
        detail:
          'Random with a collision check, a hash of the contents, or a pre-generated pool handed out by a service. Each has a distinct failure mode under concurrency, and that is the conversation.',
      },
      {
        term: 'It is read-heavy by orders of magnitude',
        detail:
          'That ratio is what justifies the cache and the CDN — and it should come out of your own estimate, not an assertion.',
      },
      {
        term: 'Expiry is storage design',
        detail: 'TTLs plus the job that actually reclaims the space. Say who deletes, and when.',
      },
    ],
    related: [
      { route: '/hld/cache', label: 'The read path' },
      { route: '/hld/database', label: 'Where the pastes live' },
    ],
  },

  '/hld/case-studies/twitter': {
    heading: 'Fan-out is the whole question',
    body: [
      'Everything in this design hangs off a single decision: whether a timeline is assembled when a tweet is written or when the timeline is read. Candidates who pick one and defend it do well. Candidates who describe both and choose neither do not.',
    ],
    points: [
      {
        term: 'Fan-out on write',
        detail:
          'Precompute every follower’s timeline. Reads become trivial, and one celebrity with fifty million followers makes a single write enormous.',
      },
      {
        term: 'Fan-out on read',
        detail: 'Merge at query time. Writes become trivial, and reads get expensive and slow for everyone.',
      },
      {
        term: 'The expected answer is hybrid',
        detail:
          'Fan out for ordinary accounts, merge high-follower accounts in at read time. Say roughly where the threshold sits and what decides it.',
      },
    ],
    related: [
      { route: '/hld/case-studies/social-graph', label: 'The graph underneath it' },
      { route: '/hld/asynchronism', label: 'Where the fan-out actually runs' },
    ],
  },

  '/hld/case-studies/web-crawler': {
    heading: 'The parts that are easy to skip',
    body: [
      'A crawler looks like a graph traversal and gets interesting exactly where politeness and deduplication meet distribution. The minutes are best spent on what stops the crawler being either rude or redundant.',
    ],
    points: [
      {
        term: 'Dedupe at a scale that does not fit in memory',
        detail:
          'A URL-seen set of billions of entries is a Bloom filter or a sharded store, not a hash set. Say which, and what a false positive costs you.',
      },
      {
        term: 'Politeness is per host, not global',
        detail:
          'Rate limiting has to partition by domain, and that constrains how you shard the frontier. This connection is the good answer.',
      },
      {
        term: 'Content dedup is not URL dedup',
        detail: 'Different URLs serve identical pages. A content hash catches what URL normalisation misses.',
      },
      {
        term: 'Recrawl is a scheduling problem',
        detail: 'A news homepage and a static archive page do not deserve the same interval.',
      },
    ],
    related: [
      { route: '/hld/asynchronism', label: 'The frontier as a queue' },
      { route: '/hld/case-studies/query-cache', label: 'What gets built on the crawl' },
    ],
  },

  '/hld/case-studies/mint': {
    heading: 'Designing around a dependency you do not own',
    body: [
      'What makes Mint different from the other case studies is that the hard constraints are external. Bank APIs are slow, rate limited, and unreliable, and the product has to stay useful anyway. That is the thread worth pulling.',
    ],
    points: [
      {
        term: 'Never call the bank on the request path',
        detail:
          'Extracts run on a schedule into your own store, and the user always reads yours. Getting this the wrong way round is the classic mistake here.',
      },
      {
        term: 'Failure is routine, not exceptional',
        detail:
          'One connector being down cannot degrade the whole account view. Per-source freshness and status is part of the product, not error handling.',
      },
      {
        term: 'Categorisation is a pipeline with a human in it',
        detail:
          'Merchant matching first, user overrides always win, and the override is kept as signal for next time.',
      },
    ],
    related: [
      { route: '/hld/asynchronism', label: 'Where the extracts run' },
      { route: '/hld/database', label: 'Storing what you pulled' },
    ],
  },

  '/hld/case-studies/social-graph': {
    heading: 'When the graph stops fitting on one machine',
    body: [
      'The single-machine version of this is a breadth-first search and takes two minutes to describe. The entire question is what happens after the graph is sharded, because BFS across shards turns every hop into a network round trip that fans out.',
    ],
    points: [
      {
        term: 'Shard by person and hops become RPCs',
        detail:
          'A shortest path of length four crosses the network four times, fanning out at every level. Say that cost before you are asked for it.',
      },
      {
        term: 'Bidirectional search halves the depth',
        detail:
          'Searching from both ends and meeting in the middle cuts the explored set dramatically. It is the expected optimisation.',
      },
      {
        term: 'Cache the hot centre',
        detail:
          'A small number of very well connected people appear in most paths and are worth keeping resident everywhere.',
      },
    ],
    related: [
      { route: '/hld/case-studies/twitter', label: 'What gets built on this graph' },
      { route: '/hld/database', label: 'Sharding the storage' },
    ],
  },

  '/hld/case-studies/query-cache': {
    heading: 'Why eviction is the question',
    body: [
      'This is the case study that sits closest to a coding round. The LRU itself is a known structure, so the design content is everything around it: sizing, memory limits, and what happens when a cached result quietly becomes wrong.',
    ],
    points: [
      {
        term: 'LRU is an assumption, not a law',
        detail:
          'Say why recency suits search traffic, and what would make LFU or a plain TTL the better choice. That sentence is the difference.',
      },
      {
        term: 'Sizing comes from an estimate',
        detail: 'Entries times entry size against a memory budget you stated out loud, not a number you assert.',
      },
      {
        term: 'Invalidation on index update',
        detail:
          'These results are derived data. When the index changes the cache is wrong, and the design has to say how it finds out.',
      },
    ],
    related: [
      { route: '/lld/lru-cache', label: 'Write the structure' },
      { route: '/hld/cache', label: 'The same problem at system scale' },
    ],
  },

  '/hld/case-studies/sales-rank': {
    heading: 'A batch problem in a real-time costume',
    body: [
      'The instinct is a running counter per item, and it does not survive the requirements: ranks are per category, over a window, across a very large catalogue. Recognising this as an aggregation job rather than a counter is most of the answer.',
    ],
    points: [
      {
        term: 'The log is the source of truth',
        detail: 'Ranks are a derived view recomputed on a schedule from sales events, not a number you increment.',
      },
      {
        term: 'The window is a product decision',
        detail: 'Last hour, last day, last week — it changes the entire pipeline. Ask for it in the first five minutes.',
      },
      {
        term: 'Serve from a precomputed table',
        detail: 'The read path is a lookup and never an aggregation. Say that explicitly; it is the point of the design.',
      },
    ],
    related: [
      { route: '/hld/asynchronism', label: 'Running the aggregation' },
      { route: '/hld/database', label: 'Storing the derived view' },
    ],
  },

  '/hld/case-studies/scaling-aws': {
    heading: 'The one to practise narrating',
    body: [
      'This is a sequence rather than a design: the same system at growing load, with exactly one bottleneck removed per step. It is the best rehearsal available for the last phase of an interview, because every move has to be justified by the constraint that provoked it.',
    ],
    points: [
      {
        term: 'Each step answers a measurement',
        detail:
          'Vertical scale, split the tiers, add replicas, add a cache, then shard. Nothing is added speculatively, and that discipline is the lesson.',
      },
      {
        term: 'Say what broke',
        detail: '"The database is CPU-bound on reads above 5k RPS" is the sentence that earns you the read replica.',
      },
      {
        term: 'Know where each move stops working',
        detail:
          'Vertical scaling has a ceiling, read replicas do nothing for writes, and a cache does not fix a write bottleneck.',
      },
    ],
    related: [
      { route: '/hld/load-balancer', label: 'The first split' },
      { route: '/hld/database', label: 'Where it ends up' },
    ],
  },

  '/hld/additional-interview-questions': {
    heading: 'Getting value out of a question list',
    body: [
      'A list of questions is only useful as a generator, not as a reading list. Most of these reduce to a handful of shapes you have already practised, and spotting the shape quickly is the transferable skill.',
    ],
    points: [
      {
        term: 'Classify before designing',
        detail:
          'Read-heavy feed, write-heavy ingest, search, or scheduled aggregation. Each has a default architecture you can argue from and then adjust.',
      },
      {
        term: 'Reuse the case studies you have done',
        detail:
          'A file sync service is Pastebin plus conflict resolution. A recommendation system is sales rank with a better ranking function.',
      },
      {
        term: 'Practise the first five minutes only',
        detail:
          'Scoping twenty questions builds more than fully solving three, because scoping is the part that is always graded.',
      },
    ],
    related: [
      { route: '/hld/case-studies', label: 'The worked solutions' },
      {
        route: '/getting-started/how-to-approach-a-system-design-interview-question',
        label: 'The scoping method',
      },
    ],
  },

  /* --------------------------------------------------------------------- LLD */

  '/lld/interview-questions': {
    heading: 'What an object-oriented design round grades',
    body: [
      'These rounds are not asking for a clever algorithm. They are asking whether you can turn an ambiguous sentence into classes with clear responsibilities, and then absorb a new requirement without rewriting everything.',
    ],
    points: [
      {
        term: 'Clarify before you name a class',
        detail:
          'The requirements exchange at the top of each solution is the graded part, not a preamble to skim past.',
      },
      {
        term: 'Nouns are a starting point, not the design',
        detail:
          'A class per noun gives you an anemic model. The question that turns it into a design is what behaviour each one owns.',
      },
      {
        term: 'Design for the follow-up',
        detail:
          'The interviewer will add a requirement. Enums and conditionals that then need editing in six places are the trap; polymorphism is the escape hatch.',
      },
      {
        term: 'Say the trade-off aloud',
        detail:
          '"I am using inheritance here, and it hurts the moment a vehicle can be two types" is a genuinely strong sentence.',
      },
    ],
    related: [
      { route: '/lld/parking-lot', label: 'The most-asked one' },
      { route: '/lld/lru-cache', label: 'The one with a real algorithm in it' },
    ],
  },

  '/lld/hash-map': {
    heading: 'Why this gets asked',
    body: [
      'Everyone has used a hash map and far fewer can say what happens when two keys collide. That is the whole point of the exercise: a compact test of whether you understand a structure you depend on every day.',
    ],
    points: [
      {
        term: 'Chaining or open addressing',
        detail:
          'Chaining is simpler to write under pressure. Open addressing is more cache-friendly and genuinely awkward to delete from. Know why you picked one.',
      },
      {
        term: 'State the complexity honestly',
        detail: 'O(1) average, O(n) worst case when every key lands in the same bucket. Volunteering the worst case reads well.',
      },
      {
        term: 'Resizing is the follow-up',
        detail: 'Load factor, doubling, and the fact that every existing key has to be rehashed on the way across.',
      },
    ],
    related: [
      { route: '/lld/lru-cache', label: 'Where it gets combined with a list' },
      { route: '/hld/cache', label: 'The same idea at system scale' },
    ],
  },

  '/lld/lru-cache': {
    heading: 'The pairing is the answer',
    body: [
      'This question tests one specific insight: neither a hash map nor a linked list alone gives O(1) for both lookup and eviction, and combining them does. Produce that pairing quickly and the rest of the round is about writing clean code.',
    ],
    points: [
      {
        term: 'Map to the node, not to the value',
        detail: 'The map has to hand you the list node, or unlinking is not O(1) and the whole structure loses its point.',
      },
      {
        term: 'Doubly linked, always',
        detail: 'A singly linked list cannot unlink in constant time without already holding the predecessor.',
      },
      {
        term: 'A read is a mutation',
        detail: 'Move-to-front on get. Forgetting it is the most common bug in this exercise and it is easy to spot.',
      },
    ],
    related: [
      { route: '/lld/hash-map', label: 'Half of the structure' },
      { route: '/hld/case-studies/query-cache', label: 'The system design version' },
    ],
  },

  '/lld/call-center': {
    heading: 'A dispatch problem, not a class hierarchy',
    body: [
      'The escalation ladder tempts candidates straight into an inheritance tree, and the interesting behaviour is somewhere else entirely: what happens when nobody is free. The queue, not the hierarchy, is where this design actually lives.',
    ],
    points: [
      {
        term: 'Rank, do not subclass',
        detail:
          'A level attribute on an employee handles escalation without three near-identical classes that differ only in a constant.',
      },
      {
        term: 'Design the "everyone is busy" path',
        detail:
          'Queue the call, and say how it gets assigned when somebody frees up. Most answers stop one step before this.',
      },
      {
        term: 'Dispatch belongs to the centre',
        detail: 'A call should not be hunting for its own operator. Give the dispatcher that responsibility explicitly.',
      },
    ],
    related: [
      { route: '/lld/parking-lot', label: 'The same allocation shape' },
      { route: '/lld/interview-questions', label: 'What is being graded' },
    ],
  },

  '/lld/deck-of-cards': {
    heading: 'Where the extension point goes',
    body: [
      'The base design is easy and the follow-up is guaranteed: now make it blackjack, now make it poker. The grade comes from whether the deck was built generic enough to absorb that without a rewrite.',
    ],
    points: [
      {
        term: 'Card value is game-specific',
        detail:
          'An ace is 1 or 11 in blackjack and the highest card in poker. Value belongs to the game, not to the card, and putting it on the card is the mistake being looked for.',
      },
      {
        term: 'Shuffle in place, deal from a cursor',
        detail: 'Rebuilding the collection on every deal is the naive version and it is visible immediately.',
      },
      {
        term: 'Name what you left out',
        detail:
          'Multiple decks, jokers, burn cards. Cheap to mention and it shows you thought past the happy path.',
      },
    ],
    related: [
      { route: '/lld/interview-questions', label: 'The general method' },
      { route: '/lld/parking-lot', label: 'Another extension-point question' },
    ],
  },

  '/lld/parking-lot': {
    heading: 'The classic, and its trap',
    body: [
      'This is the most-asked object-oriented design question, and its trap is well known. Vehicle types crossed with spot types produce a combinatorial mess if you model the rules with conditionals, and the interviewer will add a vehicle type specifically to find out whether you did.',
    ],
    points: [
      {
        term: 'Let the spot decide',
        detail:
          'A `canFit(vehicle)` on the spot keeps the rule in one place. A chain of if-statements inside the lot spreads that rule everywhere it will have to be edited.',
      },
      {
        term: 'Availability is the scaling question',
        detail:
          'Scanning every spot is fine for a demo. A count per level and per size is the answer once the lot is real, and it is a natural follow-up.',
      },
      {
        term: 'Pricing is a separate concern',
        detail: 'A strategy the ticket consults, not arithmetic buried inside the lot.',
      },
    ],
    related: [
      { route: '/lld/call-center', label: 'The same allocation problem' },
      { route: '/lld/interview-questions', label: 'What the round is grading' },
    ],
  },

  '/lld/online-chat': {
    heading: 'Where this one gets hard',
    body: [
      'Users and messages are quick to model. The design pressure is in group conversations, and in the fact that chat is fundamentally a delivery problem: somebody has to be told, and they may not be connected when it happens.',
    ],
    points: [
      {
        term: 'Private and group want one abstraction',
        detail:
          'A conversation with participants, not two parallel code paths that drift apart the moment a feature is added.',
      },
      {
        term: 'Offline delivery is what shapes it',
        detail:
          'Messages must persist and be delivered on reconnect, which makes the store — not the socket — the source of truth.',
      },
      {
        term: 'Read state is per participant',
        detail: 'One message, many read positions. That is a join table, and it is the follow-up question.',
      },
    ],
    related: [
      { route: '/hld/communication', label: 'How the messages travel' },
      { route: '/lld/interview-questions', label: 'The general method' },
    ],
  },

  /* --------------------------------------------------------------- reference */

  '/reference/powers-of-two-table': {
    heading: 'Using this under pressure',
    body: [
      'This table matters because estimation in an interview happens out loud, without a calculator, while somebody watches. Two or three anchors you have actually memorised beat the whole table sitting in a tab.',
    ],
    points: [
      {
        term: 'Anchor on three numbers',
        detail: '2^10 is a thousand, 2^20 a million, 2^30 a billion. Everything else you can interpolate on the spot.',
      },
      {
        term: 'Round aggressively and say so',
        detail:
          'There are 86,400 seconds in a day; call it 100,000. A million seconds is about twelve days. Precision is not what is being tested.',
      },
      {
        term: 'State the assumption, not just the number',
        detail: '"Call it 1 KB per record" is what makes the estimate checkable, and checkable is what earns the credit.',
      },
    ],
    related: [
      { route: '/reference/latency-numbers-every-programmer-should-know', label: 'The other half of the toolkit' },
      {
        route: '/getting-started/how-to-approach-a-system-design-interview-question',
        label: 'Where in the interview this goes',
      },
    ],
  },

  '/reference/latency-numbers-every-programmer-should-know': {
    heading: 'What these numbers are for',
    body: [
      'These are not trivia. They exist so you can say why a design keeps something in memory instead of on disk, or why a cross-region round trip rules out a synchronous call — with an order of magnitude behind the claim instead of an instinct.',
    ],
    points: [
      {
        term: 'Memorise the ratios, not the digits',
        detail:
          'Memory is roughly 100x faster than SSD, SSD roughly 100x faster than a disk seek, and a cross-Atlantic round trip dwarfs all three.',
      },
      {
        term: '150 ms across the Atlantic is a design constraint',
        detail: 'It decides where data lives and whether a call can be synchronous at all. Use it as a constraint, not a fact.',
      },
      {
        term: 'Use them to reject options quickly',
        detail:
          '"That is three sequential cross-region calls, so 450 ms before we have done any work" closes a branch of the discussion cleanly.',
      },
    ],
    related: [
      { route: '/reference/powers-of-two-table', label: 'The sizing half' },
      { route: '/hld/content-delivery-network', label: 'The usual answer to distance' },
    ],
  },

  '/reference/real-world-architectures': {
    heading: 'Reading these for interview value',
    body: [
      'Engineering write-ups are the closest thing available to a worked answer from people who had to live with the consequences. They are most useful read backwards: find the constraint that forced the design, not the technology it happened to land on.',
    ],
    points: [
      {
        term: 'Look for the "why now"',
        detail:
          'Nearly every post describes a scale at which the previous design broke. That threshold is the transferable part, and it is usually one sentence.',
      },
      {
        term: 'Ignore the stack',
        detail: 'Which queue they chose matters far less than why they needed a queue at all.',
      },
      {
        term: 'Note what they gave up',
        detail:
          'Every one of these designs traded something away. Naming that trade is exactly what an interviewer is listening for from you.',
      },
    ],
    related: [
      { route: '/reference/company-architectures', label: 'Sorted by company' },
      { route: '/hld/case-studies', label: 'The same shapes, worked through' },
    ],
  },

  '/reference/company-architectures': {
    heading: 'Preparing for a specific company',
    body: [
      'Reading the architecture of the company you are interviewing with is worth an hour, with one caveat: repeating their own design back to them is not the win it feels like. The value is in the vocabulary and in the problems they clearly care about.',
    ],
    points: [
      {
        term: 'Learn their problem shape',
        detail:
          'A company built on feeds asks feed questions. A payments company asks consistency questions. That is what to prepare.',
      },
      {
        term: 'Do not assume it is current',
        detail: 'Published architectures are often years behind the running system. Treat them as history, not documentation.',
      },
      {
        term: 'Have one informed question ready',
        detail: 'Referencing something specific they published is a strong way to end a round.',
      },
    ],
    related: [
      { route: '/reference/real-world-architectures', label: 'How to read them' },
      { route: '/reference/company-engineering-blogs', label: 'Where the newer material is' },
    ],
  },

  '/reference/company-engineering-blogs': {
    heading: 'A reading habit that compounds',
    body: [
      'These are more useful as a slow drip than a cram. One post a week, read for the decision rather than the technology, is what builds the pattern library that later makes an unfamiliar interview question feel familiar.',
    ],
    points: [
      {
        term: 'Prefer the post-mortems',
        detail:
          'A failure write-up teaches more about a system’s real constraints than any launch announcement, because it describes what actually bound it.',
      },
      {
        term: 'Keep one line per post',
        detail: 'Problem, constraint, decision. That note is what you will actually be able to recall months later.',
      },
      {
        term: 'Follow the ones near your target role',
        detail: 'Infrastructure posts for an infrastructure role, product-scale posts for a product one.',
      },
    ],
    related: [
      { route: '/reference/real-world-architectures', label: 'The curated set' },
      { route: '/reference/company-architectures', label: 'Sorted by company' },
    ],
  },
};

export function commentaryFor(route: string): Commentary | undefined {
  return COMMENTARY[route];
}
