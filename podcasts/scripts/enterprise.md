# Podcast: Enterprise Patterns

**Episode Topic:** Enterprise Patterns
**Estimated Duration:** 35 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_enterprise.md

---

## Opening

HOST: Imagine you're running a chatbot in production, serving thousands of users. Everything's going great until suddenly—boom—your API starts returning errors. Not because your code broke, not because the service is down, but because you hit something called a "rate limit." And now you're wondering: why can't I just pay more money and use as much as I want?

EXPERT: That's the quintessential enterprise API problem right there. And it's not just about money—it's actually about everyone playing nice in a shared sandbox. Today we're diving into enterprise patterns for working with LLM APIs, and rate limits are honestly where most people first encounter the reality that these aren't just normal APIs you can hammer however you want.

HOST: So we're talking about the boring stuff that keeps production systems running?

EXPERT: Exactly—the boring stuff that prevents you from getting paged at 3 AM. We'll cover rate limits, how to structure your API access with workspaces, and choosing between AWS, Google, and Azure for deploying Claude. The unglamorous infrastructure decisions that actually matter.

## Understanding Rate Limits

HOST: Okay, let's start with rate limits. I get the basic idea—you can only make so many requests—but why do they exist in the first place? Is it really just to prevent abuse?

EXPERT: Abuse prevention is part of it, but think about it from the provider's perspective. They're running these massive GPU clusters that cost millions of dollars. If one customer could monopolize all that capacity by sending unlimited requests, everyone else would have a terrible experience. Rate limits are really about fairness and predictability.

HOST: So it's like a restaurant with limited seating. You can't just let one party take every table.

EXPERT: Perfect analogy. And just like restaurants, these APIs measure limits in multiple dimensions simultaneously. There's RPM—requests per minute—which is like how many tables you can occupy. But there's also TPM—tokens per minute—which is more like the total amount of food the kitchen can prepare.

HOST: Wait, why do you need both? If I'm limited to 60 requests per minute, isn't that enough?

EXPERT: Here's where it gets interesting. Imagine you're sending 60 requests per minute, but each request is asking the model to process a 10,000-token document and generate a 5,000-token response. That's 15,000 tokens per request times 60 requests, which is 900,000 tokens per minute. If your TPM limit is only 100,000, you'll hit that ceiling immediately—even though you're well under your RPM limit.

HOST: Oh, so they're independent constraints. You could hit either one first depending on what you're doing.

EXPERT: Exactly. And Claude actually goes even further—they separate input tokens per minute and output tokens per minute. So you have three separate buckets: ITPM, OTPM, and RPM. Hit any one of them, and you get what's called a 429 error.

HOST: That sounds like it would be incredibly annoying to track manually.

EXPERT: It would be, which is why most people don't track it manually. They just send requests and react when they get throttled. But there's a smarter way to think about it. The algorithm behind most rate limiting is something called a token bucket.

## The Token Bucket Algorithm

HOST: Okay, I've heard of buckets in programming before, but what's a token bucket?

EXPERT: Picture a physical bucket that can hold, say, 1,000 tokens. Every second, someone pours new tokens into the bucket at a steady rate—maybe 100 tokens per second. When you make an API request, you reach in and grab however many tokens that request costs. If there aren't enough tokens in the bucket, your request gets rejected.

HOST: So the bucket is constantly refilling?

EXPERT: Yes, at a constant rate. And this is the key insight: the bucket lets you burst. If you haven't made any requests for 10 seconds, the bucket fills up to its maximum capacity. Now you can send 10 requests all at once, grabbing all those tokens instantly. But then you're back to waiting for the bucket to refill at its steady rate.

HOST: That's really different from what I imagined. I thought rate limits were like "you get 60 requests and then at the top of the next minute, it resets."

EXPERT: That's called a fixed-window counter, and it has a major vulnerability. If the window resets at the top of each minute, I can send 60 requests at 11:59:59 and another 60 requests at 12:00:01. That's 120 requests in two seconds, which could overwhelm the system. Token bucket prevents that because the refill rate is continuous.

HOST: So even though Claude says "50 requests per minute," I can't actually send 50 requests in one second?

EXPERT: Correct. If you try to send 10 requests instantly, you'll probably hit the limit even though you're technically under 50 per minute average. The token bucket enforces smoothness. It's pacing you throughout the minute.

## Usage Tiers

HOST: Alright, so I understand the mechanism now. But you mentioned earlier that rate limits aren't just universal—they vary per user?

EXPERT: They vary based on what's called your usage tier. Claude has a tier system where you start at Tier 1 when you first sign up, and as you spend more money consistently, you automatically graduate to higher tiers with dramatically higher limits.

HOST: How dramatic are we talking?

EXPERT: At Tier 1, you get 50 requests per minute. At Tier 4, you get 4,000 requests per minute. For input tokens, Tier 1 gives you 30,000 per minute. Tier 4 gives you 2 million per minute. We're talking 80x more capacity.

HOST: Okay, so how do you get to Tier 4? Do you just email them and ask nicely?

EXPERT: It's entirely automatic based on spend thresholds. To reach Tier 2, you need to have purchased at least $40 in credits. Tier 3 requires $200. Tier 4 requires $400. You also can't jump tiers—you have to progress through each one sequentially.

HOST: So if I'm a startup and I suddenly go viral, I might hit my Tier 1 limits before I've spent enough to advance?

EXPERT: That's exactly the pain point. You're rate-limited by historical spend, not by current demand. Which is why it's worth knowing this in advance. Some teams will actually prepay credits early in development just to advance their tier before launch day.

## Handling Rate Limits in Code

HOST: Let's say I'm writing code and I hit a 429 error. What's the right way to handle that?

EXPERT: The industry standard is exponential backoff with jitter. When you get a 429, you wait a bit and retry. If you get another 429, you wait twice as long. Then four times as long. Then eight times.

HOST: Why exponential? Why not just wait the same amount of time each time?

EXPERT: Because if 100 clients all get rate-limited at the same moment and they all wait exactly 1 second before retrying, they'll all hit the server again at exactly the same time. That's called a thundering herd, and it makes the problem worse. Exponential backoff spreads the retries out over time.

HOST: And what's jitter?

EXPERT: Jitter is adding a small random delay to each retry. So instead of waiting exactly 2 seconds, you might wait 2.3 seconds or 1.8 seconds. It's another way to prevent synchronized retries. Think of it like traffic merging onto a highway—if everyone merged at exactly the same instant, it would be chaos. Random spacing smooths things out.

HOST: Okay, so in Python, how would I actually implement this?

EXPERT: There's a great library called tenacity that does it for you. You just add a decorator to your function: `@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))`. That says: retry up to 6 times, waiting exponentially between 1 and 60 seconds with random jitter.

HOST: And if all 6 retries fail?

EXPERT: Then you've got a bigger problem. Either the service is down, or your rate limits are fundamentally too low for your workload. At that point you need to rethink your architecture.

## Proactive Rate Management

HOST: Is there a way to avoid hitting rate limits in the first place instead of just reacting to them?

EXPERT: Absolutely. That's called proactive rate management. If you know you have a 60 RPM limit, you can space your requests about 1 second apart. Simple `time.sleep(1)` between requests.

HOST: That seems... almost too simple?

EXPERT: It is simple, and it works beautifully for batch processing workloads where you're not in a hurry. The problem is when you have bursty traffic. If you have 10 requests that all arrive at the same moment, you can't make users wait 10 seconds for serial processing.

HOST: So what do you do then?

EXPERT: You use a queue. Incoming requests go into a queue, and worker processes pull from the queue at a controlled rate. Now your users get quick acknowledgments—"we've received your request"—and you process them in the background at a sustainable pace.

HOST: That makes sense. Are there other techniques?

EXPERT: One of my favorites is prompt caching, which is specific to Claude but incredibly powerful. Claude has a feature where if you send the same input repeatedly, they cache it server-side. The cached tokens don't count toward your ITPM limit.

HOST: Wait, they don't count toward the rate limit at all?

EXPERT: That's right. If you have a 2 million ITPM limit and 80% of your tokens are cached, you're effectively getting 10 million input tokens per minute of throughput. The cached tokens still cost you money—about 10% of the base price—but they don't count toward your rate limit.

HOST: So the trick is to structure your prompts so the expensive parts are cacheable?

EXPERT: Exactly. Cache your system instructions, cache large context documents, cache tool definitions. The part that changes—the actual user question—stays uncached, but that's usually small compared to the context.

## Workspaces

HOST: Alright, let's shift gears. You mentioned something called workspaces. What problem do they solve?

EXPERT: Okay, imagine you're a company with three teams all using Claude. The chatbot team, the search team, and the internal tools team. If they all share the same API keys and the same rate limit pool, what happens when the internal tools team runs a runaway script?

HOST: They... blow through the rate limit and take down the chatbot?

EXPERT: Bingo. That's the noisy neighbor problem. Workspaces solve this by letting you create isolated environments with separate API keys and separate rate limits. Now each team gets their own workspace with its own ceiling.

HOST: So it's like partitioning resources?

EXPERT: Yes. And it also solves the cost attribution problem. If you want to know how much each team is spending, you can't do that with one shared API key. But with workspaces, each team's usage is tracked separately. You can even set spend limits per workspace.

HOST: Can you transfer API keys between workspaces if priorities change?

EXPERT: No, and this is critical to understand early. Once you create an API key in a workspace, it's permanently bound to that workspace. You can't move it. If you realize you put production keys in the wrong workspace, you have to create new keys and redeploy.

HOST: That sounds like a gotcha that would burn you exactly once.

EXPERT: Exactly once, very painfully. Which is why you should plan your workspace structure before you start handing out API keys to production systems.

## Workspace Hierarchy

HOST: How do workspace limits interact with organization-level limits?

EXPERT: Both are enforced. Think of it like a hierarchy. The organization has a total rate limit—let's say 100,000 ITPM. You might allocate 70,000 to your production workspace, 20,000 to staging, and 10,000 to development.

HOST: So those add up to 100,000?

EXPERT: They could, but they don't have to. Here's the key: workspace limits are ceilings, not reservations. If you set production to 70,000, that means production can't exceed 70,000. But it doesn't reserve that capacity. If another workspace is idle, production could theoretically use more—but it's still capped by the organization's total limit of 100,000.

HOST: So it's like soft partitioning, not hard partitioning.

EXPERT: Exactly. Which is good for flexibility but means you can't truly guarantee capacity to a workspace. If your organization limit is 100,000 and three workspaces all try to use 40,000 simultaneously, someone's getting throttled.

HOST: What about the default workspace? Can you set limits on that?

EXPERT: No, and this trips people up. Every organization has a default workspace that gets created automatically, and you cannot set rate limits or spend limits on it. If you need limits, you have to create a new workspace.

HOST: Why would they design it that way?

EXPERT: Probably to avoid breaking existing users who joined before workspaces existed. Their keys all lived in the default workspace, and suddenly imposing limits would have disrupted production systems.

## Environment Segmentation

HOST: You mentioned production, staging, and development. Is that a common pattern for workspace structure?

EXPERT: It's probably the most common pattern, yeah. You create three workspaces: production gets most of your rate limit and a high spend cap, staging gets moderate limits, and development gets low limits. That way a developer experimenting locally can't accidentally consume all your organization's capacity.

HOST: What about team-based workspaces instead of environment-based?

EXPERT: That works too, especially for cost attribution. If you want to charge back API costs to different product teams, give each team its own workspace. Then you can use the usage API to pull costs per workspace for internal billing.

HOST: Can you do both? Like, multiple teams and multiple environments?

EXPERT: You could, but you're limited to 100 workspaces per organization. So if you have 10 teams and 3 environments, that's 30 workspaces—still feasible. But you'd need to be thoughtful about it. Most companies pick one primary dimension—either by team or by environment—and structure around that.

## API Key Management

HOST: What about API key rotation? How often should you rotate keys?

EXPERT: The recommended cadence is every 90 days. The process is: create a new key in the workspace, deploy it to your services, monitor that the old key shows zero usage, disable the old key but don't delete it for 30 days, then delete it after the verification period.

HOST: Why the 30-day waiting period?

EXPERT: In case something broke and you didn't notice. Maybe there's a cron job that only runs monthly, or a backup system you forgot about. The 30-day grace period gives you time to discover those edge cases before permanently destroying the old key.

HOST: And you mentioned there are two types of API keys?

EXPERT: Yes, regular API keys start with `sk-ant-api` and are for making inference requests. Admin API keys start with `sk-ant-admin` and are for managing workspaces, members, and keys programmatically.

HOST: So if I wanted to automate workspace creation, I'd need an admin key?

EXPERT: You can automate workspace management, but there's a weird limitation: you cannot programmatically create new API keys. The admin API can list keys, disable keys, but not create them. Key creation has to happen through the web console.

HOST: That seems like an odd restriction.

EXPERT: It does. My guess is it's a security decision to ensure key creation always involves a human with console access, but it definitely limits automation.

## Multi-Cloud Deployment

HOST: Let's talk about the third piece—deploying Claude through AWS, Google, or Azure. Why would you use those instead of hitting Anthropic's API directly?

EXPERT: A few reasons. First, billing consolidation. If your company already has an AWS account and you're paying millions a year for EC2 and S3, adding Claude charges to that same bill is way easier than getting a new vendor approved. Second, compliance. If you're in a regulated industry, you might already have AWS or Azure certified for your compliance frameworks. Third, existing IAM and access control. You can use the same AWS IAM roles and policies you already have instead of managing separate Anthropic API keys.

HOST: So it's mostly about fitting into existing enterprise infrastructure?

EXPERT: Exactly. The models are the same, the API is nearly identical, but it integrates with your existing cloud stack.

HOST: Are there feature differences?

EXPERT: New features tend to appear on Anthropic's direct API first and roll out to cloud platforms weeks or months later. So if you need bleeding-edge capabilities, you might be waiting. But for most enterprises, that's fine. Stability matters more than being first.

## Global vs Regional Endpoints

HOST: You mentioned something called global versus regional endpoints. What's the difference?

EXPERT: Global endpoints route your request dynamically to whatever region has capacity. It's optimized for availability and performance with no pricing premium. Regional endpoints guarantee that your data stays within a specific geography—US, EU, APAC—and they cost 10% more.

HOST: When would you pay the 10% premium?

EXPERT: When you have data residency requirements. If you're a European company subject to GDPR and your legal team says data cannot leave the EU, you use the EU regional endpoint. Same for US government contractors with data sovereignty rules.

HOST: Does that apply to all the cloud platforms?

EXPERT: Yes, AWS Bedrock, Google Vertex AI, and Azure Foundry all support global and regional endpoints for Claude Sonnet 4.5 and newer models. Older models don't have that distinction.

HOST: What about model availability across regions?

EXPERT: This is a major gotcha. Not all models are available in all regions. APAC regions, in particular, often have limited selection. You need to check the cloud provider's documentation for current availability in your target region before committing to a deployment plan.

## Authentication Patterns

HOST: How does authentication work on each platform?

EXPERT: On AWS Bedrock, you use standard AWS credentials—access keys, secret keys, or IAM roles. On Google Vertex AI, you use gcloud authentication or service accounts. On Azure Foundry, you can use API keys or Entra ID tokens, which is the new name for Azure AD.

HOST: So they all use their platform's native auth system?

EXPERT: Exactly. Which is great if you already have that infrastructure set up, but it also means you need to learn three different auth systems if you're multi-cloud.

HOST: Are there required permissions you need to set up?

EXPERT: Yes. On AWS, you need permissions like `bedrock:InvokeModel` and `bedrock:ListFoundationModels`. On Google, you need to enable the Vertex AI API first with `gcloud services enable`. On Azure, it depends on whether you're using API keys or Entra ID, but you'll need access to the Foundry resource.

HOST: And if I wanted to use Claude Code—the CLI tool—with AWS Bedrock, how would I set that up?

EXPERT: You'd set environment variables. `CLAUDE_CODE_USE_BEDROCK=1` tells it to use Bedrock, `AWS_REGION=us-east-1` specifies the region, and you can pin the model version with `ANTHROPIC_DEFAULT_SONNET_MODEL`. That prevents unexpected behavior if a new model version rolls out.

## Prompt Caching Across Platforms

HOST: Does prompt caching work the same way on all three platforms?

EXPERT: Mostly, yeah. All three support it with the same 0.1x pricing for cached reads—cached tokens cost 10% of the base input token price. The default cache TTL is 5 minutes, but you can request up to 1 hour on some models.

HOST: Some models?

EXPERT: Here's a gotcha: on Vertex AI, the 1-hour TTL isn't supported for older models like Claude 3.7 Sonnet, Claude 3.5 Sonnet, or Claude 3 Opus. You have to stick with the 5-minute default for those. Only the latest models support extended TTL.

HOST: How do you actually enable caching in your code?

EXPERT: You add a `cache_control` parameter to your system messages or tool definitions. For example, if you have a long system prompt that doesn't change, you'd wrap it in a dict with `"cache_control": {"type": "ephemeral", "ttl": "1h"}`. Now that content gets cached server-side.

HOST: And the cache lasts for an hour even if you don't make any requests?

EXPERT: No, the TTL is a sliding window. If you make a request that hits the cache, the cache lifetime extends. But if there's no activity for an hour, it expires.

## Common Mistakes

HOST: Let's talk about mistakes. What do people get wrong when they're first setting up enterprise LLM infrastructure?

EXPERT: The biggest one is not pinning model versions. People use aliases like "sonnet" in their API calls, thinking it will always work. But if a new model version rolls out and it's not enabled in their account, requests start failing. Always use explicit model IDs in production, like `claude-opus-4-6-v1`.

HOST: What else?

EXPERT: On AWS Bedrock, there's a confusing quirk with PDF analysis. If you use the Converse API for analyzing PDFs, it requires citations to be enabled for visual analysis of charts, images, and layouts. But if you use the InvokeModel API, you get full control without forced citations. People don't realize there are two different APIs with different behaviors.

HOST: That seems like an implementation detail that should be hidden.

EXPERT: It is frustrating. Another mistake is assuming workspace limits reserve capacity. They don't—they're ceilings, not quotas. If you allocate 30,000 ITPM to your production workspace, you're not guaranteed to have that capacity available. Another workspace could consume it if they're hitting the organization limit simultaneously.

HOST: What about the OpenAI max_tokens parameter? I've heard that's confusing.

EXPERT: Yes! On OpenAI, when you set `max_tokens=1000`, that counts toward your TPM limit immediately at request time, even if the model only generates 200 tokens. Claude doesn't do that—Claude's OTPM only counts actual output tokens. So on OpenAI, you can hit rate limits from reserved capacity that you never actually used.

HOST: That seems wasteful.

EXPERT: It is, but it's how their system works. The workaround is to set `max_tokens` as low as you can reasonably tolerate.

HOST: Any mistakes specific to Azure?

EXPERT: Azure Foundry has a unique deployment model. Unlike Bedrock and Vertex where you just call a shared model endpoint, Foundry requires you to create a deployment first. The deployment name—not the model ID—goes in your API requests. People forget this step and get confused why their requests fail.

HOST: And the deployment is something you manage?

EXPERT: Yes, through the Azure portal. You create a deployment, give it a name, and that name becomes your model identifier in API calls.

## Multi-Model Fallback

HOST: Is there a pattern for dealing with rate limits across multiple models or providers?

EXPERT: Absolutely. You can implement multi-model fallback where you try Claude Opus first, and if you get rate-limited, fall back to Claude Haiku or even GPT-4o Mini. The idea is that different models have separate rate limit pools, so you're spreading the load.

HOST: Does that actually work well in practice?

EXPERT: It works for non-critical workloads where response quality can vary a bit. But you have to be careful because different models have different strengths. If you're falling back to a much weaker model, your user experience might degrade. It's more of a "stay online at any cost" strategy.

HOST: What about batch processing? I know some APIs offer batch modes.

EXPERT: Yes, Claude and OpenAI both have batch APIs for non-time-sensitive bulk processing. You queue up requests in a processing pool, they run at lower priority, and you typically get 50% off the price. Batch APIs also have separate rate limit pools, so they don't interfere with your real-time traffic.

HOST: When would you use that?

EXPERT: Data labeling, batch translation, backfilling embeddings for a vector database—anything where you can tolerate hours or days of latency. You're trading speed for cost and capacity.

## Wrap-up

HOST: Alright, let's bring this home. If someone's building a production LLM application for the first place, what are the key takeaways they need to remember?

EXPERT: First, rate limits are multi-dimensional. You have RPM, TPM, and sometimes separate input and output token limits. You need to respect all of them simultaneously. Second, implement exponential backoff with jitter for retries—don't just hammer the API when you get throttled. Third, use workspaces to isolate teams or environments so one bad actor can't take down everything.

HOST: What about choosing a platform?

EXPERT: If you're already on AWS, Google, or Azure, use their Claude integration for billing and compliance simplicity. But remember that new features arrive on Anthropic's direct API first. Pin your model versions in production to avoid surprise breakages. And if you have data residency requirements, use regional endpoints even though they cost 10%.

HOST: And caching?

EXPERT: Prompt caching is a superpower. Cache your system instructions, your tool definitions, your large context documents. Cached tokens cost 10% and don't count toward your input token rate limit. For high-throughput workloads, caching can give you 10x effective capacity.

HOST: Any final advice?

EXPERT: Plan before you deploy. Draw out your workspace structure, decide on environment segmentation, and set up monitoring for spend and rate limit usage. The time you spend on boring infrastructure planning will save you from very exciting 3 AM incidents.

HOST: I think we just made infrastructure planning sound almost interesting.

EXPERT: Almost. But hey, at least your production system won't fall over.

HOST: That's a wrap. Thanks for tuning in.
