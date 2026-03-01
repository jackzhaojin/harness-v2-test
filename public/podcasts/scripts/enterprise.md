HOST: Okay, so I was looking at my API bills this month and I had this moment of panic where I'm like, wait, did we just get throttled in production? And it got me thinking—how do these systems even decide when to say "no, not right now"?

EXPERT: Oh, that's a fun rabbit hole. So here's the thing most people don't realize—when you hit a rate limit, it's not like the API is just counting "one, two, three, okay that's sixty requests, you're done." There's this whole algorithm running behind the scenes.

HOST: Wait, it's not just counting?

EXPERT: Nope! Most modern rate limiting uses something called the token bucket algorithm. And I know that sounds fancy, but the mental model is actually kind of brilliant. Picture a bucket that holds, I don't know, a thousand tokens.

HOST: Okay, I'm picturing a literal bucket.

EXPERT: Good! So tokens are constantly dripping into this bucket at a fixed rate—let's say a hundred tokens per second. Every time you make a request, you reach into the bucket and grab however many tokens that request costs. If there are enough tokens, great, your request goes through. If not? 429 error, rate limit exceeded.

HOST: Huh. So it's not like... it doesn't reset at the top of every minute?

EXPERT: Exactly! That's the key difference. Old-school rate limiting used fixed time windows—like, you get sixty requests per minute, and at the stroke of the new minute, boom, the counter resets to zero. But that creates this vulnerability.

HOST: What do you mean, vulnerability?

EXPERT: Okay so imagine you send sixty requests at 11:59:59, right at the very end of a minute. Then the clock ticks over to noon, and you immediately send another sixty requests at 12:00:01. Technically you're within your limits for each individual minute, but you just sent a hundred and twenty requests in two seconds. That's a boundary attack.

HOST: Oh! Oh, that's sneaky. I mean, I'm not saying I would do that, but—

EXPERT: Right, right, right. But the token bucket solves this because it's continuous. The bucket refills smoothly over time, so you can't game the system by clustering requests at window edges.

HOST: That's actually kind of elegant. But wait—doesn't that mean sometimes you can burst above your stated limit?

EXPERT: Yes! And that's a feature, not a bug. If you've been quiet for a while, your bucket fills up to its max capacity. Then you can send a bunch of requests all at once, as long as you have enough tokens saved up. It's like... you know when you haven't used your phone all day and then you need to make a bunch of calls back-to-back? You can do that because you "saved" your capacity.

HOST: Okay but here's where I get confused. I see these API docs that list like five different limits. Requests per minute, tokens per minute, sometimes there's a requests per day limit... are all of those using separate buckets?

EXPERT: Oh yeah, it gets messy. So you've got RPM—requests per minute—which is just counting API calls. A tiny "hello world" prompt counts the same as a massive 10,000-token document. Then separately, you've got TPM, tokens per minute, which is tracking the actual token usage.

HOST: And I'm guessing hitting any one of those limits kills your request?

EXPERT: Bingo. You could be well under your token limit but if you've made too many requests, you're still getting throttled. Or the opposite—you could make one giant request that blows through your entire token budget in a single call.

HOST: That seems unnecessarily complicated.

EXPERT: I mean, kind of? But here's why it exists. RPM prevents you from hammering the API with thousands of tiny requests that could overload the routing infrastructure. TPM prevents you from sending huge compute-intensive prompts that would monopolize GPU resources. They're protecting different parts of the system.

HOST: Okay, that makes sense. So if I'm building something in production, I need to track both of these myself?

EXPERT: Well, the smart APIs actually help you out. They send back response headers that tell you where you stand. Like, "you have 500 requests remaining" or "your token bucket resets at this timestamp."

HOST: Oh, so you can be proactive about it instead of just waiting to get smacked with errors.

EXPERT: Exactly. Although, okay, here's where it gets interesting. Let's say you do get rate limited. What do you do?

HOST: Uh... wait and try again?

EXPERT: Yeah, but how long do you wait? If you retry immediately, you're just going to hit the same limit again. If you wait too long, you're wasting time. The standard approach is exponential backoff with jitter.

HOST: I've heard that term but I'm not totally sure what the "exponential" part means.

EXPERT: So the idea is, after your first failure, you wait one second. Second failure, you wait two seconds. Third failure, four seconds. Then eight, sixteen, thirty-two—it doubles every time. You're exponentially increasing the wait time.

HOST: And what's the jitter part?

EXPERT: Oh, that's to prevent the thundering herd problem. Imagine a hundred clients all get rate limited at exactly the same moment. If they all use the same exponential backoff, they'll all retry at exactly the same moment too, and you just recreate the problem.

HOST: Oh no.

EXPERT: Right? So you add a random amount of jitter—like, instead of waiting exactly four seconds, you wait four seconds plus a random value between zero and one second. Now all those clients are spread out when they retry.

HOST: That's... actually really clever. I wouldn't have thought of that.

EXPERT: It's one of those things that seems obvious in hindsight but absolutely wrecks you the first time you encounter it in production. Like, "why does my system keep oscillating between working and failing?" Oh, thundering herd.

HOST: Okay so I'm tracking rate limits, I've got exponential backoff in place... but what if I just want to avoid hitting the limits in the first place? Is there like a proactive strategy?

EXPERT: Yeah! Instead of reacting to errors, you can pace yourself. If you know you've got a sixty RPM limit, just add a one-second delay between requests. Sixty requests, sixty seconds—perfect spacing, never hit the limit.

HOST: Wait, that's it? That seems almost too simple.

EXPERT: I mean, it works! Obviously if you're doing something more complex with variable request sizes or multiple concurrent workers, you need fancier throttling. But for batch jobs? Yeah, just sleep for a second between calls.

HOST: Huh. Okay but here's something I don't get. I keep hearing about these "usage tiers" where your limits go up as you spend more money. How does that actually work?

EXPERT: Okay so this is basically the API provider's way of saying "we trust you more once you've proven you're a real customer." When you first sign up, you're in Tier 1 with pretty conservative limits. As you spend money—like, forty bucks gets you to Tier 2, two hundred gets you to Tier 3—your rate limits scale up dramatically.

HOST: How dramatic are we talking?

EXPERT: Let's look at Claude's tiers. Tier 1 gives you 50 requests per minute and 30,000 input tokens per minute. Tier 4? Four thousand requests per minute and two million input tokens per minute.

HOST: That's... that's an eighty-times increase on requests.

EXPERT: Yeah, and like a sixty-seven-times increase on tokens. It's massive. The thing is, this isn't just about money—it's also about preventing abuse. If someone creates a hundred free accounts to bypass rate limits, they're not going to spend $400 on each one to reach Tier 4.

HOST: So it's anti-fraud basically.

EXPERT: Yep. And it also means if you're launching a new product and you expect high traffic, you need to ramp up your spending gradually beforehand. You can't just go from zero to hero overnight.

HOST: Wait, so if I suddenly go viral, I'm screwed?

EXPERT: Well, there's usually a "contact sales" option for emergency tier bumps. But yeah, the tiers are designed to encourage steady, predictable usage growth. Sharp spikes can actually trigger additional throttling even if you're technically within your rate limits.

HOST: Okay that seems like a gotcha that would ruin my week.

EXPERT: Oh, it gets better. Different API providers have different quirks. Like, OpenAI counts your max_tokens parameter against your TPM limit at request time, even if the model ends up generating way fewer tokens.

HOST: Why would they do that?

EXPERT: Because they need to reserve capacity. When your request comes in, they don't know how many tokens the model will actually generate. So they assume the worst case—whatever you set as max_tokens—and reserve that capacity.

HOST: Whereas Claude...

EXPERT: Claude only counts actual output tokens. They have separate limits for input and output—ITPM and OTPM.

HOST: Oh, so with Claude I could set a huge max_tokens value without it hurting me?

EXPERT: Exactly! As long as the model doesn't actually generate that many tokens, you're fine. This is honestly one of my favorite design decisions because it means you're not penalized for being cautious with your max_tokens setting.

HOST: Okay, okay, so we've been talking about rate limits at the API key level, but what about when you have like a whole team or a whole company using these APIs? How do you manage that?

EXPERT: Ooh, this is where workspaces come in. So the idea is, you've got your organization at the top level—that's your company, your billing account, all of that. Then underneath, you create these isolated environments called workspaces.

HOST: So like... one workspace per team?

EXPERT: That's one pattern, yeah. Or one workspace per environment—like, you'd have a production workspace, a staging workspace, a development workspace. Each workspace gets its own API keys, its own spend limits, its own rate limits.

HOST: And those limits are separate from each other?

EXPERT: Well, sort of. They're subsets of your organization's overall limit. So if your org has 40,000 tokens per minute, you might allocate 30,000 to production and 10,000 to development. The key is they're isolated—a runaway script in your dev workspace can't exhaust your production capacity.

HOST: Oh, that's smart. Because I've definitely had the experience where someone's test script hammers an API and then suddenly production is getting throttled.

EXPERT: Right, right, right! This is the whole "noisy neighbor" problem. Workspaces solve that. And you can also use them for cost attribution—like, if you want to know how much each product team is spending on API calls, just give each team its own workspace and track it in your billing dashboard.

HOST: So I could do like internal chargebacks.

EXPERT: Exactly. Finance teams love this.

HOST: Okay but I'm guessing there are constraints. Like, can I create a thousand workspaces for every little microservice?

EXPERT: Nope, you're capped at a hundred workspaces per organization. So you need to be thoughtful about your hierarchy. Don't create a workspace for every single project—think bigger, like teams or environments.

HOST: And once I create an API key in a workspace, I'm assuming it stays there?

EXPERT: Yeah, it's permanently bound. You cannot move an API key between workspaces. So you need to plan your structure before you start issuing keys to production systems, because if you mess it up, you're regenerating keys and redeploying.

HOST: That sounds like a fun Saturday.

EXPERT: Oh, and here's a fun gotcha—every organization has this "default workspace" that you can't rename, you can't delete, and you can't set limits on.

HOST: Why does that exist?

EXPERT: I think it's mostly for backward compatibility. Like, when they first rolled out workspaces, everyone's existing API keys had to live somewhere. So they auto-created the default workspace. But because it has no limits, it's kind of a black hole. Best practice is to create new workspaces for everything and just ignore the default one.

HOST: Okay, so let's say I've got my workspaces set up, I've got my rate limits configured... but I want to manage all this programmatically. Is there an API for that?

EXPERT: Yes! There's the Admin API. But here's the weird part—you need a special API key for it.

HOST: Wait, my regular API key doesn't work?

EXPERT: Nope. Regular API keys start with `sk-ant-api...` and they're for calling the actual models. Admin API keys start with `sk-ant-admin...` and they're only for administrative operations—creating workspaces, managing members, listing API keys.

HOST: Can I use an admin key to call the models?

EXPERT: No, they're completely separate. Which is actually good security design—if someone steals your admin key, they can't rack up your API bill by making a million model calls. They can just... reorganize your workspaces, which is bad, but less expensive.

HOST: Okay fair. So what can I do with the Admin API?

EXPERT: You can create and archive workspaces, add and remove members, assign roles, configure rate limits... oh, but here's a weird limitation: you can't create API keys programmatically.

HOST: What? Why not?

EXPERT: I don't know! You can list them, you can deactivate them, but creating new ones requires going into the Console UI. It's one of those things where I assume there's a security reason but it's kind of annoying for automation.

HOST: Yeah that seems like an oversight.

EXPERT: Speaking of automation though, there's a whole other angle we haven't talked about, which is: what if you don't want to manage all this infrastructure yourself?

HOST: Oh, like, what if I want someone else to deal with rate limits and billing and all that?

EXPERT: Exactly. This is where the cloud platforms come in—AWS Bedrock, Google Vertex AI, Microsoft Foundry. They all offer managed access to Claude models.

HOST: So I'm still calling Claude, but I'm going through AWS instead of Anthropic directly?

EXPERT: Yep. The model runs as a serverless API on their infrastructure. You use your existing AWS credentials, it shows up on your AWS bill, it integrates with all your AWS security policies... same deal with Google Cloud or Azure.

HOST: Okay, so when would I want that versus just using Anthropic's API directly?

EXPERT: If you're already deep in one cloud ecosystem, it's way easier. Like, if you've got everything in AWS and you're using IAM for access control and CloudWatch for logging—just use Bedrock. You don't have to set up a whole separate billing relationship with Anthropic, you don't have to integrate a new auth system, all your monitoring tools just work.

HOST: That actually makes a lot of sense for enterprises.

EXPERT: Yeah, and there's also the compliance angle. If you need data residency guarantees—like, "all our data has to stay within the EU"—you can use regional endpoints on these platforms.

HOST: Wait, so the models are deployed in specific regions?

EXPERT: It depends. There are global endpoints that dynamically route your requests to wherever capacity is available. Super reliable, no pricing premium. Then there are regional endpoints that guarantee your data stays within a specific geography—US, EU, Asia-Pacific. Those cost 10% more but they're essential if you've got regulatory requirements.

HOST: So if I'm building something for a European customer that's subject to GDPR, I'd use the EU regional endpoint.

EXPERT: Exactly. And this applies across all three platforms—Bedrock, Vertex, and Foundry all support both global and regional endpoints as of the newer Claude models.

HOST: How do the three platforms compare? Like, is one better than the others?

EXPERT: They're surprisingly similar in terms of features. All three support the latest models—Opus 4.6, Sonnet 4.6, Haiku 4.5. They all support prompt caching, extended context windows, all the core features.

HOST: So it's really just about which cloud you're already using?

EXPERT: Pretty much. Although there are some weird quirks. Like, SDK support varies—PHP only works with Bedrock, Ruby doesn't support Foundry. And new features tend to appear on Anthropic's direct API first, then roll out to the cloud platforms a few weeks or months later.

HOST: Oh, so if I need bleeding-edge capabilities I should stick with the direct API?

EXPERT: Yeah, or at least be aware of the lag. Also, Foundry has this weird thing where you have to create a deployment before you can use a model, whereas Bedrock and Vertex just let you hit shared endpoints.

HOST: What does that mean, "create a deployment"?

EXPERT: It's like... you're provisioning your own instance of the model? Not quite, it's still serverless, but you're giving it a name and configuring it. Then you reference that deployment name in your API calls instead of the model ID.

HOST: That seems like an extra step.

EXPERT: It is! But I think the idea is it gives you more control over versioning and configuration. Like, you could have a "production-claude" deployment and a "staging-claude" deployment with different settings.

HOST: Okay I can see the argument for that, but it definitely adds complexity.

EXPERT: Yeah. And another gotcha—Bedrock has this thing with PDF analysis where if you use the Converse API, you're forced to enable citations for visual analysis. If you don't want that, you have to use the InvokeModel API instead.

HOST: Why would that be a limitation?

EXPERT: I have no idea! It's just one of those weird platform-specific quirks. Every platform has a few of them.

HOST: Alright, so I want to ask about something that I think is secretly the most important part of all this, which is: how do I keep costs from spiraling out of control?

EXPERT: Oh man, yeah. This is the thing that keeps CTOs up at night. You deploy some feature that uses an LLM API, it goes viral, and suddenly you're getting a five-figure bill.

HOST: Has that actually happened to people?

EXPERT: Oh yeah. I mean, not always because of virality—sometimes it's just a bug. Like, someone deploys a chatbot that gets stuck in a loop and makes ten thousand API calls before anyone notices.

HOST: That's nightmare fuel.

EXPERT: Right? So the first line of defense is workspace spend limits. You set a hard cap—like, "this workspace cannot spend more than $500 a month"—and when you hit it, the API keys just stop working.

HOST: Isn't that kind of drastic? Like, if it's my production workspace and we hit the limit mid-month, my whole app goes down.

EXPERT: Yeah, it's a tradeoff. You need to set the limit high enough that you won't hit it under normal circumstances, but low enough that a runaway process can't bankrupt you. And you should set up email alerts at 50%, 75%, 90% so you have time to react.

HOST: Okay, so monitoring and alerts. What else?

EXPERT: Prompt caching is huge for cost optimization. If you're sending the same system prompt or context documents over and over, you can cache them and only pay 10% of the normal price for cache reads.

HOST: Wait, so if I'm sending the same 10,000-token system prompt a hundred times, I only pay full price once and then 10% for the other ninety-nine?

EXPERT: Exactly! And it also makes your requests faster because the model doesn't have to re-process those tokens. You can see up to 85% latency reduction.

HOST: That seems like a no-brainer. Why wouldn't everyone do this?

EXPERT: Honestly, a lot of people don't realize it exists. Or they don't structure their prompts to take advantage of it. Like, the cached content has to be at the beginning of your prompt and it has to be identical across requests. If you're constantly tweaking your system instructions, caching doesn't help.

HOST: So you need to stabilize your prompt structure.

EXPERT: Yeah. And there's a TTL—time to live. By default, cached content expires after five minutes. You can extend it to an hour on some platforms, but if your requests are spread out over days, you're not going to get much benefit.

HOST: Okay, so caching is great for high-frequency, repetitive workloads.

EXPERT: Exactly. Like, if you're processing a queue of customer support tickets and they all use the same system prompt, perfect use case. If you're doing one-off research queries that are all unique, caching doesn't help much.

HOST: What about batch APIs? I've seen those mentioned but I don't really understand what they're for.

EXPERT: So the idea is, if you have a bunch of requests that don't need immediate responses—like, you're analyzing a thousand documents overnight—you can submit them as a batch. They go into a processing queue, and you get the results when they're done.

HOST: And the advantage is...

EXPERT: Throughput and cost. Batch APIs usually have higher rate limits because the provider can optimize scheduling. And they often come with a significant discount—like, 50% off compared to the synchronous API.

HOST: Fifty percent?

EXPERT: Yeah! Because you're giving the provider flexibility. They can run your batch during off-peak hours when they have spare capacity. It's a win-win.

HOST: Okay, so for anything that's not user-facing and time-sensitive, I should be using the batch API.

EXPERT: Pretty much. Although, you know, it's not available everywhere yet. Like, it might be on Anthropic's direct API but not rolled out to Bedrock or Vertex yet. You'd have to check.

HOST: Right, the whole feature lag thing we talked about earlier.

EXPERT: Exactly. Oh, and here's one more cost optimization trick that's kind of clever—multi-model fallback.

HOST: What's that?

EXPERT: So you define a priority list of models. You try to call your first-choice model—maybe that's Opus because you want the highest quality. If you get rate limited, you automatically fall back to Sonnet. If that's rate limited, fall back to Haiku or even a different provider like OpenAI.

HOST: Oh, so you're trading quality for availability.

EXPERT: Right. And you can get creative with it—maybe your first-choice model is expensive but high-quality, and your fallback is cheaper but still good enough for most queries. You only pay the premium price when you have capacity, and you degrade gracefully when you're under load.

HOST: That's actually really smart. Although I imagine it's kind of complicated to implement?

EXPERT: It's like twenty lines of code with a for-loop and a try-catch. The harder part is figuring out your fallback strategy—like, which queries can tolerate a lower-quality model? Do you need to adjust prompts for different models? That's more of a product decision than an engineering one.

HOST: Yeah, I can see that. Okay, so I think we've covered a lot—rate limits, workspaces, cloud platforms, cost optimization. Is there anything we missed that's going to surprise people when they deploy this stuff in production?

EXPERT: Oh, definitely. Here's one that gets everyone: shared limits across model families.

HOST: What does that mean?

EXPERT: So let's say you've got a rate limit for Claude Opus 4. That limit actually applies to all Opus 4 versions combined—4.6, 4.5, 4.1, whatever. If you're calling multiple versions, they're all drawing from the same bucket.

HOST: Oh, so I can't like double my throughput by just calling two different models?

EXPERT: Nope! They thought of that. Same deal with Sonnet, same deal with Haiku—the limit is per model family, not per specific version.

HOST: Okay, that's good to know. What else?

EXPERT: Cached tokens still cost money. This confuses people because we just talked about how cached tokens don't count toward your input token rate limit. But you're still billed for them, just at a 90% discount.

HOST: So it's cheaper but not free.

EXPERT: Exactly. Don't confuse rate limits with pricing—they're separate systems. Caching helps with rate limits and with cost, but it's not a magical free lunch.

HOST: Right, right, right. Okay, what about the Azure thing you mentioned earlier? The ratio thing?

EXPERT: Oh yeah, this is a weird one. On Azure OpenAI, the RPM limit is proportional to your TPM limit at a fixed ratio—six RPM per thousand TPM. So if you have a 10,000 TPM quota, you only get 60 RPM.

HOST: That seems really low.

EXPERT: It is! And it catches people off guard because on other platforms, RPM and TPM are independent. But Azure couples them, so if you're making a lot of small requests, you can hit the RPM limit way before you hit the token limit.

HOST: So you'd have to batch your requests or something?

EXPERT: Yeah, or just be aware of it when you're designing your application. Like, if you're doing real-time chat where every user message is a separate API call, you might hit that RPM limit with only a few concurrent users.

HOST: Okay, last question. If someone's listening to this and they're about to deploy an LLM-powered feature in production, what's the one thing you'd want them to remember?

EXPERT: Ooh. Um, I think it's this: rate limits are not failures, they're feedback. If you're hitting rate limits, it means you're either at the edge of your tier and you need to upgrade, or you've got a usage pattern that's inefficient and you need to optimize. Either way, it's information. Don't just slap exponential backoff on it and call it a day—actually look at why you're hitting the limit and decide if that's the system working as intended or if you need to change something.

HOST: That's a good framing. Because I think the natural reaction is "oh no, errors, this is bad."

EXPERT: Yeah, but a 429 isn't like a 500 where something broke. It's the system saying "you're asking for more than your current allocation allows." That's a scaling signal, not a failure signal.

HOST: And if you're hitting it constantly, maybe it's time to spend forty bucks and get to Tier 2.

EXPERT: Exactly! Or architect your system to use caching, or move to batch processing, or split traffic across multiple workspaces. You've got options.

HOST: Alright, I think that's a good place to wrap. This was way more nuanced than I expected. I came in thinking "rate limits are just a number" and now I'm thinking about token buckets and thundering herds and workspace hierarchies.

EXPERT: Yeah, it's one of those things where the surface is simple—"you can make sixty requests per minute"—but there's so much depth once you start deploying real systems.

HOST: And a lot of gotchas.

EXPERT: So many gotchas. But that's what makes it interesting, right? Every platform has its quirks, every use case has its optimal strategy. You've got to actually understand the system to use it well.

HOST: Which is, I guess, what we've been trying to do here.

EXPERT: Exactly. Alright, go forth and rate limit responsibly.

HOST: That should be on a t-shirt.
