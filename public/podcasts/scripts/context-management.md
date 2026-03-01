HOST: So here's a question that's been bugging me. You're building this really slick AI agent, right? It's doing great work, calling tools, having these long multi-turn conversations, and then one day your bill comes in and it's just... astronomical. Like, you're reprocessing the same hundred thousand tokens over and over and over again.

EXPERT: Every single API call. Every single turn. The full context window, re-tokenized, reprocessed, billed.

HOST: That's like... okay, imagine you're at a restaurant, and every time you want to order dessert, the waiter makes you re-read the entire menu from appetizers. Out loud. And you're paying by the word.

EXPERT: That's actually not a bad analogy. And here's the thing — this was just how it worked for a long time. You accepted it. But now there's this whole toolkit around context window management that most developers are either not using or using wrong.

HOST: And that's what I want to dig into today, because there's prompt caching, there's context compaction, there's token counting — and they all interact with each other in ways that are, honestly, kind of sneaky.

EXPERT: Sneaky is the right word. Let's start with the one that saves the most money, because I think that hooks people. Prompt caching.

HOST: Okay so, the basic pitch is what — you process a prompt once, and then subsequent calls that share the same prefix get to skip all that work?

EXPERT: Exactly. So the way it works is, there's a strict ordering. The system processes your request in this hierarchy — tools first, then system prompt, then messages. And you can mark certain content blocks with this cache control parameter. Everything from the beginning of your request up to that marker becomes your cached prefix.

HOST: And if the next request has the same prefix...

EXPERT: It just reads it from cache instead of reprocessing. And this is where the numbers get wild. A cache read costs one-tenth of the normal input price. So you're looking at a ninety percent discount on those tokens.

HOST: Wait — ninety percent?

EXPERT: Ninety percent. And the latency improvement is just as dramatic. They cite an example of a hundred-thousand-token document going from eleven and a half seconds to two point four seconds on the second call.

HOST: That's... that's not a minor optimization. That's a fundamentally different user experience.

EXPERT: Right. And the break-even point is just two API calls. The first call pays a small premium — one-point-two-five times the base price for the five-minute cache — and then every subsequent call within that window saves ninety percent. Two calls and you're already ahead.

HOST: Okay so let's talk about that window, because I think this is where people get tripped up. There's a five-minute TTL and a one-hour TTL. Walk me through that.

EXPERT: So the default is five minutes. You make a cached request, the cache lives for five minutes, and — this is important — every time you hit that cache, the timer resets. So if you're in an active conversation, making calls every minute or two, the cache effectively lives forever.

HOST: Oh, that's clever. So it's not five minutes from creation, it's five minutes from last use.

EXPERT: Exactly. But here's one of those gotchas that I love — some developers have reported that the five-minute window is actually closer to three minutes in practice.

HOST: Seriously? Like, the documented TTL doesn't match reality?

EXPERT: The docs still say five minutes, but there's enough anecdotal evidence that if you're cutting it close — say, four minutes between calls — you might want to budget for misses. And if your workflow has longer gaps, there's the one-hour option. It costs double the base input price on the write, so it's more expensive to set up, but the reads are still that same ninety percent discount.

HOST: And you mentioned there's a minimum size to even be eligible for caching?

EXPERT: Yeah, this catches people. You can't cache a tiny system prompt. For Sonnet models, the minimum is one thousand twenty-four tokens. For Opus? Four thousand ninety-six tokens. So your little "you are a helpful assistant" one-liner — that's not getting cached.

HOST: Right, you need to actually have a substantial prefix. Which honestly, in real production apps, you usually do.

EXPERT: Absolutely. Your tool definitions, your system prompt with all the instructions, your few-shot examples — that adds up fast. And speaking of tool definitions, here's something that blew my mind a little.

HOST: Go on.

EXPERT: A single tool definition can cost three hundred to five hundred tokens. Just one. If you've got ten, fifteen tools registered, that's potentially five thousand tokens just in tool definitions, every single call.

HOST: So caching those becomes a no-brainer.

EXPERT: Total no-brainer. You slap the cache control marker on the last tool in your list, and every tool before it gets cached as part of that prefix. Same with your system prompt. The pattern most people should use is four cache breakpoints — tools, system instructions, your RAG context or document, and then the conversation history. Each one changes at a different frequency, so you get maximum cache hits.

HOST: Okay, but here's what I want to know. What breaks the cache? Because prefix matching sounds fragile.

EXPERT: Oh, it is fragile. And this is where developers lose money without realizing it. The cache is prefix-based, right? So if you change anything early in the sequence, everything downstream gets invalidated.

HOST: Everything.

EXPERT: Everything. Add an image to your messages? Cache invalidated. Change your tool choice parameter? Cache invalidated. Toggle web search on or off? That actually modifies the system prompt internally, so — cache invalidated.

HOST: Wait, toggling web search invalidates your system prompt cache? Even though you didn't touch the system prompt?

EXPERT: Even though you didn't touch it. The system injects additional instructions under the hood. And here's one that really gets people — in languages like Go or Swift, JSON serialization can randomize key ordering. So your tool definitions might serialize differently every time, and the cache just... never hits.

HOST: That's brutal. You could have caching set up perfectly and be getting zero benefit because your JSON keys are shuffling around.

EXPERT: Exactly. You'd see cache writes every single call and zero cache reads, and you'd be paying MORE than if you hadn't enabled caching at all, because of that one-point-two-five-times write premium.

HOST: Okay, so — so that's the caching fundamentals. But things get really interesting when you throw extended thinking into the mix, right?

EXPERT: Oh, this is where it gets spicy. So, okay, extended thinking — where Claude can reason through problems step by step before answering. Those thinking blocks create this whole new dimension of caching complexity.

HOST: Because thinking blocks produce tokens too.

EXPERT: Lots of tokens. And here's the fundamental tension — you can't put an explicit cache control marker on a thinking block.

HOST: You can't?

EXPERT: Nope. They're excluded from being explicit cache breakpoints. But — and this is the sneaky part — they do get cached implicitly as part of the request content when you make follow-up calls with tool results.

HOST: So they're cached, but you have no control over it.

EXPERT: Right. And you're billed for those thinking tokens when they're read from cache. It's cheaper than reprocessing, sure, but it's not free, and the costs aren't immediately obvious because you didn't ask for that caching to happen.

HOST: Huh. That's... kind of a hidden cost.

EXPERT: It gets more interesting. With Claude Opus four-point-five and newer, thinking blocks from previous turns are preserved by default. Older models would strip them out. So the newer models get better cache hit rates because the thinking is still there in context, but they also eat up more of your context window.

HOST: It's a trade-off.

EXPERT: Everything in this space is a trade-off. And the cache invalidation rules around thinking are surprisingly strict. If you change your thinking budget — say from ten thousand tokens to eight thousand — that invalidates your message cache.

HOST: Even though the messages themselves didn't change?

EXPERT: Even though the messages didn't change. Your tools and system prompt stay cached, but all the message content has to be reprocessed. Same thing if you switch between adaptive thinking and manual thinking mode. Same thing if you go from thinking enabled to thinking disabled.

HOST: So the advice is basically — pick your thinking strategy at the start and stick with it?

EXPERT: That's the advice. Don't dynamically toggle thinking modes mid-conversation. You'll just be blowing up your cache over and over. And there's this other subtle thing — in a tool use loop, the entire sequence of thinking, tool call, tool result, response — that's conceptually one assistant turn. You can't change thinking mode in the middle of it.

HOST: Right, right. And you mentioned the signature field?

EXPERT: Oh yeah. Every thinking block has an encrypted signature that you have to preserve exactly when passing it back to the API. You can't modify it, you can't remove it, you can't rearrange thinking blocks. The whole sequence has to match the original output bit for bit or the verification fails.

HOST: So it's like — handle with extreme care.

EXPERT: Basically, yeah. The golden rule is: whatever the model gives you, pass it back exactly as-is.

HOST: Okay, so we've talked about caching the stuff you've already processed. But what about when you've been talking for so long that your context window is just... full? Like, two hundred thousand tokens full?

EXPERT: And this is where context compaction comes in, and honestly, I think this is the most exciting development in this whole space.

HOST: Why's that?

EXPERT: Because it solves a problem that used to require really ugly application-level code. The idea is — when your conversation gets too long, instead of just chopping off the oldest messages or crashing, the API automatically summarizes the older context and replaces it with a compact summary.

HOST: So it's like... taking notes. Instead of remembering every word of a three-hour meeting, you condense it down to the key points and keep going.

EXPERT: That's exactly it. And the summary becomes this special compaction block in the conversation. When the API sees that block in a subsequent request, it ignores everything before it and just works from the summary forward.

HOST: And this happens automatically?

EXPERT: You set a trigger threshold — the default is a hundred fifty thousand tokens — and when the input hits that threshold, compaction kicks in. The minimum you can set is fifty thousand tokens. And the really clever thing is that you can combine this with the pause-after-compaction option.

HOST: What does that do?

EXPERT: It lets you intervene between the compaction and the response. So the model generates the summary, pauses, and then you can inject preserved messages — like, "okay, keep the summary, but also keep the last two turns verbatim because they're directly relevant."

HOST: Oh, that's smart. You get the space savings of compaction but you don't lose the immediacy of the recent conversation.

EXPERT: Exactly. And you can provide custom instructions for how the summarization should work. Tell it what to prioritize, what to preserve.

HOST: But — and I feel like there has to be a "but" here.

EXPERT: There are a few buts. First, the summarization uses the same model you're running. If you're on Opus, your summaries are being generated by Opus. There's no option to use a cheaper model for the summary step.

HOST: So every compaction event has a cost proportional to your model choice.

EXPERT: Right. And second — this is the one that really matters for agentic workflows — once you summarize something away, it's gone. If the agent later needs details from that earlier context, it might have to re-fetch them. Go back to the web, re-read the file, whatever.

HOST: So you could end up in this loop where you're compacting to save tokens, but then spending tokens re-fetching the stuff you just compacted away.

EXPERT: Exactly. For iterative workflows like debugging or code review, where you keep going back to earlier context, aggressive compaction can actually make things worse. You have to find that sweet spot.

HOST: And there's a hallucination risk, right? Because it's summarizing, not compressing.

EXPERT: That's a really important distinction. Summarization generates new sentences — the model is paraphrasing, which means it can introduce inaccuracies. Compression, by contrast, keeps original phrasing but removes redundancy. Server-side compaction uses summarization, so for precision-critical applications, you want to be careful.

HOST: Okay so let me ask you this — how do all these pieces fit together? Because I feel like there's an interplay between caching and compaction that isn't obvious.

EXPERT: There absolutely is. So here's the thing — your system prompt cache survives compaction. You mark your system prompt with a cache control breakpoint, compaction happens in the message history, but the system prompt is still cached because it's a separate layer in the hierarchy. Tools, system, messages — compaction only touches messages.

HOST: Oh! That's actually really elegant. So even as your conversation gets compacted, you're still getting cache hits on the stuff that doesn't change.

EXPERT: Exactly. And this is where the token counting API completes the picture, because if you're trying to orchestrate all of this — caching, compaction, budget management — you need to know how many tokens you're actually dealing with.

HOST: Before you send the request.

EXPERT: Before you send the request. And that's exactly what the token counting endpoint does. You send it the same payload you'd send to the Messages API — same system prompt, same tools, same messages — and it tells you the exact input token count.

HOST: And it's free?

EXPERT: Completely free. Has its own rate limits separate from your inference limits. Using the token counting API doesn't eat into your actual API quota at all.

HOST: So you can call it as much as you want.

EXPERT: As much as you want. And the patterns that fall out of this are really powerful. You can do pre-flight cost estimation — "hey, this request is going to cost you twelve cents, want to proceed?" You can do smart model routing — small request goes to Haiku, medium to Sonnet, complex one goes to Opus.

HOST: Wait, actually, that model routing pattern is really interesting. You're using the token count as a proxy for complexity?

EXPERT: It's a rough proxy, but it works surprisingly well. Under a thousand tokens? Probably a simple question — send it to Haiku, fast and cheap. Under fifty thousand? Sonnet handles it well. Over fifty thousand? You probably need Opus's capability. Obviously it's not perfect — you could have a short but incredibly complex prompt — but as a heuristic for automated routing, it's solid.

HOST: And you can use it to prevent context overflow too, right?

EXPERT: Absolutely. Count your tokens, and if you're at eighty percent of the context window, start trimming old messages. Or — and this is the elegant version — use it to decide when to trigger your own compaction. Don't just rely on the server-side threshold. Count tokens, check against your budget, and if you're getting close, maybe it's time to wrap up that conversation thread.

HOST: I love that pattern of tracking compaction events. Like, every time compaction fires, you know roughly how many tokens have been processed, so you can estimate your cumulative spending.

EXPERT: Right, and you can set a hard budget. "I'm willing to spend three million tokens on this task." Track your compaction count, multiply by the trigger threshold, and when you approach the budget, inject a message telling the agent to wrap up.

HOST: Okay I want to go back to something that's been nagging me. You mentioned that the token count is technically an estimate?

EXPERT: Yeah, this is worth clarifying. It's highly accurate — it uses the same tokenizer as the inference pipeline — but the docs explicitly say actual tokens billed during inference may differ by a small amount. It's not like you're going to see a massive discrepancy, but for absolutely billing-critical applications, treat it as an approximation.

HOST: And there's this weird thing where system-added tokens — tokens Anthropic injects for internal optimizations — show up in the count but you don't get charged for them?

EXPERT: Yeah, that's one of those things where the API is being transparent about what's happening internally, even though it doesn't affect your bill. Which is nice, I guess, but can be confusing if you're trying to reconcile your token counts with your invoice.

HOST: So let me try to pull this all together, because I feel like there's a mental model emerging here. You've got these three layers working together — caching for repeated content, compaction for overflow management, and token counting for awareness and orchestration.

EXPERT: And the key insight is the hierarchy. Tools and system prompts at the top — they change rarely, cache them aggressively. RAG context in the middle — changes sometimes, cache it with shorter TTLs. Messages at the bottom — growing constantly, that's where compaction lives. And token counting is the eyes and ears that let you make smart decisions about all of it.

HOST: It's like managing memory in an operating system. You've got your cache for fast access, your working memory for active processing, and when things get full, you swap to compressed storage.

EXPERT: That's... actually a really good analogy. And just like in OS memory management, the wrong strategy can make things worse. Over-cache and you're paying write premiums for stuff that never gets reused. Over-compact and you're re-fetching everything. Don't count tokens and you're flying blind.

HOST: And there are all these sharp edges that can bite you. The JSON key ordering thing in Go and Swift. The thinking budget invalidation. The fact that toggling web search destroys your system prompt cache. These aren't things you'd discover from a quick skim of the docs.

EXPERT: No. And honestly, the one that I keep coming back to is the lack of manual cache clearing. There's no API to force-evict cached content. If you cache something wrong, you just have to... wait for it to expire.

HOST: That feels like it should be a bigger deal than it is.

EXPERT: I think in practice, the short TTLs make it manageable. Five minutes and the problem solves itself. But conceptually? Yeah, it bugs me.

HOST: So if someone's building an agentic system today — like, a real production agent that's going to have long conversations, call tools, think through complex problems — what's the play?

EXPERT: Start with token counting in your middleware. Know what you're dealing with before every call. Cache your tools and system prompt — that's free money, basically. Use the four-breakpoint pattern for content that changes at different frequencies. Choose your thinking strategy upfront and don't switch mid-conversation. Set up compaction with a reasonable threshold, but monitor for re-fetch patterns. And — this is the one people forget — test your cache hit rates. Log the cache read and cache write token counts from every response and make sure you're actually getting hits.

HOST: Because if your JSON keys are shuffling or you're inadvertently changing something in the prefix...

EXPERT: You're paying more than you would without caching and you have no idea.

HOST: You know what's fascinating about all this? A year ago, "context management" meant "don't go over the token limit." And now it's this whole discipline with its own patterns, trade-offs, and failure modes.

EXPERT: And honestly, I think it's only going to get more complex. Context windows are getting bigger, thinking is getting more sophisticated, agents are running longer. The developers who really understand how these systems interact under the hood — they're going to have a massive advantage in both cost and performance.

HOST: Because at the end of the day, the model doesn't care how smart your prompts are if you're hemorrhaging tokens on stuff it's already seen.

EXPERT: Exactly. The best prompt in the world means nothing if you're reprocessing it from scratch a hundred times a day when you could be reading it from cache for a tenth of the cost.

HOST: That's the kind of thing that separates a demo from a production system, isn't it? Not the model choice, not the prompt engineering — but whether you're managing your context like it's a precious resource. Because it is.

EXPERT: It really is. And I think once you start thinking of your context window as a resource to be managed — not just a bucket to fill — everything about how you design these systems changes.
