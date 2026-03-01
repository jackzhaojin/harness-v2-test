# Podcast: Context Window Management

**Episode Topic:** Context Window Management
**Estimated Duration:** 35 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_context-management.md

---

## Opening

HOST: So I was building this chatbot the other day, and everything was working great for the first few messages. Then suddenly, around message 20, the whole thing just... broke. Crashed with some cryptic error about context limits. Have you ever had that happen?

EXPERT: Oh yeah, that's the classic "I forgot about context windows" moment. And honestly, it catches almost everyone at some point. You're cruising along, the conversation is flowing, and then boom—you hit the wall.

HOST: Right? And that got me thinking—we talk about these AI models like they have this massive memory, but there's clearly some limit here. What's actually happening under the hood?

EXPERT: Think of it like this: imagine you're trying to have a conversation while holding a very long receipt in your hands. At first, it's manageable—a few items, easy to read. But as the conversation continues, that receipt keeps getting longer and longer. Eventually, it's dragging on the floor, and you physically can't hold it all anymore.

HOST: That's... actually a perfect analogy. So the context window is like how much of that receipt I can physically hold?

EXPERT: Exactly. And here's the kicker—models like Claude can hold a 200,000 token receipt. That's roughly 150,000 words, or about two full-length novels. But even with that much space, you can still run out, especially if you're doing something complex like building an AI agent that uses tools, processes documents, or has extended thinking sessions.

HOST: Wait, two novels worth of text and we can still run out? What are people putting in these prompts?

EXPERT: Well, let's say you're building a coding assistant. You might have tool definitions—those can be 300 to 500 tokens each. Then you've got your system prompt explaining how the assistant should behave. Maybe you're loading a large codebase for context—that could be 50,000 tokens right there. Add in a conversation history with back-and-forth messages, and suddenly you're looking at serious token counts.

HOST: Okay, so this is a real problem. What do we do about it?

EXPERT: That's exactly what we're going to talk about today. There are actually three major strategies: prompt caching to reuse context efficiently, context compaction to summarize old conversations, and token counting to stay ahead of the problem. Each one solves a different piece of the puzzle.

## Understanding Prompt Caching

HOST: Let's start with prompt caching. I've heard the term thrown around, but what is it actually doing?

EXPERT: Prompt caching is basically saying to the API: "Hey, I'm going to send you the same content over and over again. Can you remember it so I don't have to pay for processing it every single time?"

HOST: Like... memorizing the beginning of the conversation?

EXPERT: Exactly. Here's a concrete example. Let's say you're building a document analysis tool. You upload a 50-page PDF—that's maybe 50,000 tokens. Without caching, every time a user asks a question about that document, you're paying to process all 50,000 tokens again. With caching, you process it once, and then subsequent questions only pay for the new question tokens.

HOST: So the first request is expensive, but then everything after that is cheap?

EXPERT: Almost. The first request costs 1.25 times the normal price because the API is doing extra work to store the cached version. But after that, reading from cache costs only 0.1 times the normal price—that's a 90% discount.

HOST: Wait, so it's more expensive the first time? When does it actually save money?

EXPERT: Great question. It breaks even at just two requests. So if you ask two questions about that document, you're already saving money. And the latency improvements are even better—response times can drop by up to 85% for long prompts.

HOST: That's wild. But how does it know what to cache? Do I have to manually specify every piece of content?

EXPERT: You can, but there's actually a simpler way now. You can use automatic caching by just adding a `cache_control` parameter at the top level of your request. The API will automatically place the cache breakpoint on the last cacheable block and move it forward as the conversation grows.

HOST: Cache breakpoint—is that like a bookmark for where the caching starts and stops?

EXPERT: Exactly. Think of it as drawing a line in your prompt and saying "everything before this line should be cached." The API follows a strict hierarchy: tools first, then system prompts, then messages. So if you mark something in the messages section for caching, it automatically includes the tools and system prompt too.

HOST: Okay, but what if I have content that changes at different rates? Like, my tool definitions never change, but my conversation history is constantly updating.

EXPERT: That's where explicit cache breakpoints come in. You can place up to four breakpoints throughout your request. For example, you might cache your tool definitions separately from your system prompt, and then cache your document context separately from the conversation history. That way, when the conversation updates, you're only invalidating the conversation cache—everything else stays intact.

HOST: So it's like those Russian nesting dolls. Each layer can be cached independently?

EXPERT: Perfect analogy. And here's the really important part—caching works on exact prefix matching. If you change anything before a cache breakpoint, it invalidates all the caches downstream.

HOST: What does that mean in practice?

EXPERT: Let's say you have three cache breakpoints: one after your tools, one after your system prompt, and one after your document. If you change your system prompt, you invalidate both the system prompt cache and the document cache. But your tool cache is still good because that comes first in the hierarchy.

HOST: So order matters a lot here.

EXPERT: Hugely. And there's another gotcha—there's a minimum token threshold to cache content. For most Sonnet models, that's 1,024 tokens. For some other models, it's 2,048 or even 4,096 tokens. If your content is smaller than that, it won't be cached at all.

HOST: Why is there a minimum?

EXPERT: It's about efficiency. Caching has overhead—storing the cryptographic hashes, maintaining the cache entries. For very small content, that overhead would outweigh the benefits. So they set a threshold where caching actually makes sense.

## Caching Time-to-Live

HOST: You mentioned earlier that there's a 5-minute cache. What happens after 5 minutes—does it just disappear?

EXPERT: By default, yes. The cache has a 5-minute time-to-live, or TTL. But here's the cool part—every time you get a cache hit, the timer resets. So if you're having an active conversation, the cache can stay alive indefinitely.

HOST: Oh, so it's not 5 minutes total—it's 5 minutes of inactivity?

EXPERT: Exactly. As long as you keep the conversation going within 5-minute windows, you're golden. But if the user walks away for 10 minutes and comes back, you're starting from scratch.

HOST: What if I need longer than 5 minutes? Like, what if I'm building an agent that pauses between tool calls?

EXPERT: That's where the extended 1-hour TTL comes in. You can specify `"ttl": "1h"` in your cache control, and the cache will last for a full hour of inactivity.

HOST: But I'm guessing that costs more?

EXPERT: Yep. Instead of 1.25 times the base price for cache writes, it's 2 times the base price. But cache reads are still 0.1 times the base price, so you're still getting that 90% savings on subsequent requests.

HOST: When would I actually need the 1-hour cache?

EXPERT: Think about agentic workflows. Maybe your agent is analyzing a large codebase, making API calls to external services, waiting for user input. These workflows can easily take 10, 20, 30 minutes. With the default 5-minute TTL, your cache would expire mid-workflow. The 1-hour TTL keeps everything cached across the entire session.

HOST: Makes sense. Are there any weird edge cases I should know about?

EXPERT: Oh, definitely. One big one: concurrent requests. If you fire off multiple requests in parallel, only the first request creates the cache. The others won't see the cache until that first response completes. So if you're trying to optimize for parallel processing, you might not get the cache hits you expect.

HOST: So it's a race condition?

EXPERT: Exactly. The cache entry only becomes available after the first response begins streaming. So if you're doing parallel document analysis, the first request pays full price, and the rest have to wait for it to finish before they can benefit from caching.

## Extended Thinking and Caching

HOST: I've heard about this "extended thinking" feature where Claude thinks through problems step by step. How does that interact with caching?

EXPERT: Oh, this is where it gets interesting. Extended thinking adds a whole new layer of complexity to caching. When Claude uses extended thinking, it generates these internal "thinking blocks" that contain its reasoning process. And those thinking blocks have some unique caching behaviors.

HOST: Can I cache the thinking blocks?

EXPERT: You can't explicitly mark them for caching with a cache breakpoint—the API won't let you. But they do get cached implicitly as part of the request content.

HOST: Wait, so they're cached, but I can't control it?

EXPERT: Right. Think of it this way: when you continue a conversation after Claude has used extended thinking, you have to pass those thinking blocks back to the API unmodified. And when you do, they become part of the cached prefix.

HOST: Why do I have to pass them back?

EXPERT: To maintain reasoning continuity. If Claude started thinking about a problem in one request, it needs to remember that thought process in the next request. Otherwise, it's like having amnesia—it can't build on its previous reasoning.

HOST: Okay, but what if I change the thinking settings mid-conversation? Like, what if I switch from adaptive thinking to manual thinking?

EXPERT: That invalidates the message cache. The API treats different thinking modes as fundamentally different requests, so it can't reuse the cached messages. But here's the good news—it only invalidates the messages level of the cache. Your tool definitions and system prompt stay cached because they come earlier in the hierarchy.

HOST: So I don't lose everything?

EXPERT: Nope. And this is why that hierarchy we talked about earlier is so important. Tools, then system, then messages. Even when messages get invalidated, the earlier stuff is still cached.

HOST: What about changing the thinking budget? Like, if I go from 10,000 tokens to 8,000 tokens?

EXPERT: Same deal—invalidates the message cache but preserves tools and system prompts. The API sees that as a different configuration, so it can't reuse the previous cache.

HOST: That seems kind of annoying. Is there a way around it?

EXPERT: The best strategy is to plan your thinking configuration at the start and stick with it throughout the conversation. Don't toggle modes dynamically unless you absolutely have to. And if you're using extended thinking for long-running tasks, definitely use the 1-hour TTL so you don't lose your cache due to timeouts.

HOST: You mentioned that thinking blocks from previous turns get stripped in older models. What's that about?

EXPERT: Yeah, this is model-specific behavior. In older models like Sonnet 4.5, thinking blocks from previous assistant turns are automatically removed from context for newer requests. Only the current turn's thinking blocks are kept. But starting with Opus 4.5, they changed this—now thinking blocks are preserved by default.

HOST: Why the change?

EXPERT: Better cache hit rates in multi-step workflows. If you're running an agent that makes multiple tool calls across several turns, preserving those thinking blocks means the API can cache more of the conversation. It consumes more context window space, but you get better caching efficiency.

HOST: Trade-offs everywhere.

EXPERT: Always. And here's a subtle one—when thinking blocks are cached and read back, you're billed for them as input tokens. But with summarized thinking in Claude 4 models, you only see a summary of the thinking in the response, even though you're billed for the full thinking tokens.

HOST: Wait, so I'm paying for tokens I can't even see?

EXPERT: Exactly. The `output_tokens` in the usage metrics reflects the actual cost, not the visible response length. It's not hidden or sneaky—it's in the documentation—but it catches people off guard the first time.

## Context Compaction

HOST: Alright, let's talk about the other big strategy—context compaction. We've been talking about optimizing what's in the context window. What if we just... make the context smaller?

EXPERT: That's exactly what compaction does. Instead of truncating old messages or losing conversation history, compaction automatically summarizes older context while preserving the essential information.

HOST: So it's like taking all the old messages and condensing them into a summary?

EXPERT: Precisely. Think of it like this: imagine you're having a long conversation with someone, and every few minutes, you pause and say, "Okay, here's what we've talked about so far" and give a brief recap. Then you continue the conversation from there. That recap becomes the new baseline, and you can let go of all the detailed back-and-forth before it.

HOST: And this happens automatically?

EXPERT: Yep. You set a threshold—let's say 150,000 tokens—and when the conversation hits that threshold, the API automatically generates a summary, packages it into a "compaction block," and continues the conversation from there.

HOST: What's in the compaction block?

EXPERT: It's a summary of everything that happened before the threshold. The default summarization prompt instructs Claude to capture the state of the conversation, next steps, and any key learnings. It's designed to preserve continuity so the conversation can continue seamlessly.

HOST: Can I customize what goes into the summary?

EXPERT: Yes, by providing custom instructions. But here's a gotcha—your custom instructions completely replace the default prompt. They don't supplement it. So if you write your own instructions, you need to include all the necessary guidance about what to preserve.

HOST: What happens to all the old messages after compaction?

EXPERT: The API ignores them. When you send your next request with the compaction block included, the API automatically skips over everything before the compaction block and starts processing from the summary forward.

HOST: So I can just delete the old messages from my local message array?

EXPERT: You can, but you don't have to. It's more of a local optimization to save memory in your application. The API will ignore them either way.

HOST: Okay, but here's what I'm worried about—what if the summary loses something important? Like, what if there was a subtle detail earlier in the conversation that becomes critical later?

EXPERT: That's the big trade-off with compaction. Summarization inherently involves information loss. You're compressing dozens of messages into a single summary paragraph, and nuances get lost. The key is to tune your compaction threshold carefully. Start with high retention—maybe 150,000 or 200,000 tokens—and only make it more aggressive if you need to.

HOST: Are there situations where compaction actually makes things worse?

EXPERT: Absolutely. In iterative workflows—like code review or debugging—compaction can cause the agent to re-fetch information it already had. Let's say the agent analyzed a file earlier in the conversation, and that analysis got summarized away. Later, it might need to re-fetch and re-analyze that file, which adds latency. In those cases, the overhead of re-fetching can outweigh the token savings.

HOST: So it's not a silver bullet.

EXPERT: Not at all. It's a tool for specific use cases—mainly long-running conversations where older context genuinely becomes less relevant over time. Customer support chats, tutoring sessions, extended brainstorming. But for short, focused tasks or iterative work, you might want to skip compaction entirely.

HOST: Can I combine compaction with prompt caching?

EXPERT: Yes, and you should. Add cache breakpoints on your system prompts and tool definitions. Those survive compaction events because they're higher in the hierarchy. So even when your messages get compacted, your tools and system prompt stay cached.

HOST: What about the cost of compaction itself? Is the summarization free?

EXPERT: Nope. Claude uses the same model you specified for the summarization process, so you're paying for both the input tokens (the full conversation) and the output tokens (the summary). For really long conversations, that can add up.

HOST: So compaction saves context window space, but it doesn't necessarily save money?

EXPERT: Not directly. The value is in keeping the conversation alive indefinitely without hitting context limits. If you're charging users a subscription fee for unlimited conversations, compaction is a lifesaver. But if you're just trying to minimize token costs, you might be better off with aggressive caching strategies instead.

## Pausing After Compaction

HOST: I saw in the docs something about pausing after compaction. What's that about?

EXPERT: That's for preserving recent messages verbatim instead of summarizing them. When you enable `pause_after_compaction`, the API generates the summary and then stops processing, giving you a chance to inject preserved messages before continuing.

HOST: Why would I want to do that?

EXPERT: Let's say you want to keep the last two turns of the conversation in their original form because they're most relevant to the current task. You'd enable pause, get the compaction block back, then construct a new message array with the compaction block, the preserved messages, and the new user message. Then you send that back to continue.

HOST: So I'm essentially saying, "Summarize the old stuff, but keep the recent stuff as-is"?

EXPERT: Exactly. It gives you fine-grained control over what gets compacted and what gets preserved. The downside is it's more complex to implement—you have to handle the pause logic and rebuild the message array yourself.

HOST: Is that common in production systems?

EXPERT: It depends on the use case. For high-stakes conversations—like legal advice or medical consultations—you might want to preserve recent context verbatim to avoid any risk of summarization errors. For casual chatbots, the default behavior is usually fine.

## Token Counting

HOST: Alright, last major topic—token counting. This seems pretty straightforward. I send my message, and it tells me how many tokens it is?

EXPERT: Yep. Anthropic has a dedicated endpoint specifically for counting tokens. You send the exact same structure as you would for a message creation request—system prompt, messages, tools, everything—and it returns the precise number of input tokens.

HOST: Why is that useful? Can't I just count the characters?

EXPERT: Characters and tokens are very different. A token is roughly 3-4 characters on average, but it varies wildly. The word "strawberry" is one token, but "artificial intelligence" is two tokens. Special characters, punctuation, code—all of these tokenize differently.

HOST: So I can't reliably estimate token counts without actually tokenizing the content?

EXPERT: Exactly. And here's why it matters: token counting uses the same tokenization logic as the actual inference pipeline. So the counts are billing-accurate. If it says 10,000 tokens, you're getting billed for 10,000 tokens.

HOST: Okay, so what do I actually do with this information?

EXPERT: A few things. First, pre-flight cost estimation. Let's say a user uploads a huge document. Before you send it to Claude, you count the tokens and warn the user: "This will cost approximately $1.50 to process. Do you want to continue?"

HOST: So it's like getting a quote before starting the job?

EXPERT: Exactly. Second use case: smart model routing. You count the tokens and, if it's under 1,000 tokens, you route to Haiku for speed and cost savings. If it's over 50,000 tokens, you route to Opus for maximum capability.

HOST: Oh, so I can dynamically choose the model based on the complexity of the input?

EXPERT: Yep. And the third use case is context window management. You can count tokens before sending a request and ensure you're not about to hit the context limit. If you are, you trim old messages or trigger compaction proactively.

HOST: That makes sense. Are there any gotchas with token counting?

EXPERT: A few. First, tool definitions are expensive. A single tool can add 300-500 tokens. If you're registering 10 tools, that's 3,000-5,000 tokens before you even start the conversation.

HOST: Wow, that's a lot.

EXPERT: Yeah, and images are non-trivial too. A typical image adds 1,000-2,000 tokens depending on resolution. Always count tokens when working with multimodal inputs—you don't want surprises.

HOST: What about prompt caching? Does the token count reflect whether something is cached or not?

EXPERT: No. Token counting doesn't simulate caching. It gives you the uncached token count. So if you're trying to estimate actual costs with caching, you'll need to do some manual math based on which parts of the prompt you expect to be cached.

HOST: And I'm guessing there's a separate rate limit for token counting?

EXPERT: Yep, but it's independent of message creation. You can count tokens freely without impacting your inference capacity. The rate limits vary by usage tier, but even at the lowest tier, you get 100 requests per minute, which is plenty for most use cases.

## Common Mistakes

HOST: Okay, we've covered a lot of ground. What are the most common mistakes you see people make with context management?

EXPERT: Number one: not understanding cache invalidation. People set up caching, then they change one little thing early in the prompt—maybe they tweak the system instructions—and suddenly all their caches are invalidated. They're getting billed for cache writes every single request because the prefix keeps changing.

HOST: So consistency is key?

EXPERT: Hugely. If you're going to cache something, it needs to be stable. Your tool definitions, system prompts—those should be locked down. Don't make micro-adjustments on every request.

HOST: What else?

EXPERT: Not accounting for the minimum token thresholds. People try to cache tiny pieces of content—like a 200-token system prompt—and it doesn't work because it's below the 1,024-token minimum. Then they think caching is broken.

HOST: So you need enough content to make caching worthwhile?

EXPERT: Exactly. And another big one: mixing up TTL ordering. If you're using both 1-hour and 5-minute caches, the 1-hour entries must come first in the prompt hierarchy. If you put them out of order, you get a 400 error, and it's not immediately obvious why.

HOST: What about with compaction?

EXPERT: The biggest mistake is being too aggressive with the compaction threshold. People set it to 10,000 or 20,000 tokens thinking they're optimizing, but then the summaries start losing critical context. The agent starts asking users to repeat themselves or re-fetch information it should already know.

HOST: So start conservative and tune from there?

EXPERT: Exactly. Start at 150,000 or even 200,000 tokens, and only lower it if you're hitting context limits frequently. And monitor the quality of the summaries—make sure they're actually capturing what you need.

HOST: What about extended thinking? Any common pitfalls there?

EXPERT: Yeah, toggling thinking modes mid-conversation. It invalidates message caches, so you're paying for reprocessing. And people don't realize that thinking blocks from the current tool use loop count toward the context window, even though thinking blocks from previous turns are stripped in older models.

HOST: So it's easy to hit context limits unexpectedly?

EXPERT: Very easy. Especially in complex agentic workflows where Claude is thinking deeply at each step. Those thinking blocks can consume thousands of tokens, and they add up fast.

HOST: And with token counting?

EXPERT: The big mistake is assuming the count is exact. It's an estimate—highly accurate, but there can be small variations between the count and the actual tokens used during inference. Also, people forget that system-added tokens aren't billed. So if the count says 10,000 but you're only charged for 9,950, that's normal.

HOST: So don't treat it as gospel?

EXPERT: Right. It's a very good estimate, but build in a small buffer for safety. Don't cut things so close to the context limit that a few extra tokens cause a failure.

## Wrap-up

HOST: Alright, we've covered caching, compaction, thinking blocks, token counting—my head is spinning a little. Can you give me the key takeaways? Like, if someone's just getting started, what should they focus on?

EXPERT: Sure. First, use prompt caching for any content that repeats across requests. Tool definitions, system prompts, static documents—cache them. It's a 90% cost savings on cache reads, and it pays for itself in just two requests.

HOST: So caching is basically free money?

EXPERT: Pretty much, yeah. Second takeaway: understand the cache hierarchy—tools, then system, then messages. Keep stable content early in the hierarchy, and put changing content later. That minimizes cache invalidation.

HOST: Makes sense. What else?

EXPERT: Third, use the 1-hour TTL for long-running agentic workflows. The default 5-minute TTL is great for active conversations, but if there are pauses between steps, you need the extended TTL to keep your cache alive.

HOST: And that's worth the extra cost?

EXPERT: Usually, yes. The alternative is constantly paying for cache writes, which is even more expensive. Fourth takeaway: use context compaction for truly long conversations—100,000+ tokens—but start with a conservative threshold. Monitor the summaries and tune gradually.

HOST: Don't over-optimize too early.

EXPERT: Exactly. And the last key point: count your tokens proactively. Don't wait until you hit a context limit to start thinking about token management. Use the token counting API to estimate costs, route to the right model, and stay ahead of context limits before they become a problem.

HOST: It sounds like context management is really about planning ahead. You can't just throw content at the API and hope it works?

EXPERT: Absolutely. The models are incredibly capable, but they have constraints. If you understand those constraints and design around them—caching stable content, compacting when necessary, counting tokens proactively—you can build systems that scale to hundreds of thousands of tokens without breaking the bank.

HOST: And without breaking mid-conversation.

EXPERT: That too. Context management isn't glamorous, but it's the difference between a demo that works for five messages and a production system that handles real user conversations. Get it right, and your users will never even know it's happening in the background.

HOST: Perfect. Well, I think I finally understand why my chatbot crashed at message 20. Thanks for breaking this down.

EXPERT: Anytime. Go forth and manage that context wisely.
