# Podcast: API Integration

**Episode Topic:** API Integration
**Estimated Duration:** 35 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_api-integration.md

---

## Opening

HOST: So picture this—you've just signed up for Claude, you've got your shiny new API key, and you're ready to build something amazing. You paste in a quick curl command from the docs, hit enter, and... 401 Unauthorized. What gives?

EXPERT: Ha! I see this every single day. And nine times out of ten, it's because they used `Authorization: Bearer` instead of `x-api-key`.

HOST: Wait, seriously? That's not the standard header?

EXPERT: Nope! And that's actually our perfect entry point into API integration with Claude. Because the thing is, while APIs might look similar on the surface, the details matter tremendously. Getting those details wrong means you're not building anything at all—you're just debugging.

HOST: Okay, so today we're talking about the practical side of integrating with Claude's API. Not just "here's how you make a request," but the stuff that actually trips people up in production.

EXPERT: Exactly. We're going to cover the Messages API fundamentals, streaming responses, batch processing for cost savings, and SDK setup. And more importantly—we'll talk about the gotchas that cost you hours of debugging time if you don't know them upfront.

## Understanding the Messages API

HOST: Let's start with the basics. What exactly is the Messages API, and how is it different from, say, a simple completion endpoint?

EXPERT: Great question. The Messages API is built around conversations, not single completions. Think of it like the difference between asking someone a single question versus having an ongoing dialogue. You send Claude a history of messages—user messages and assistant messages—and Claude generates the next assistant turn.

HOST: So I'm sending the full conversation history every single time?

EXPERT: Every single time, yes. The API is completely stateless. There's no session stored on Anthropic's servers. If you want Claude to remember that three messages ago you were talking about Python, you need to include those three messages in your current request.

HOST: That sounds... expensive? Like, if I have a 50-turn conversation, I'm sending all 50 messages on turn 51?

EXPERT: You are—but this is actually a feature, not a bug. Stateless APIs are much simpler to scale and debug. You never have to worry about session timeouts, or whether the server "remembers" your context. Every request is self-contained. And there are clever optimizations, like prompt caching, that we can talk about later, which make sending repeated context very cheap.

HOST: Okay, fair enough. So walk me through what an actual request looks like. What are the pieces I absolutely need?

EXPERT: You need three things: the model name, the max_tokens parameter, and your messages array. Model is something like `claude-opus-4-6` or `claude-sonnet-4-5-20250929`. Max tokens tells Claude the absolute maximum length of the response—and this is required, no defaults.

HOST: Why no default? Seems like 1024 or something would be reasonable.

EXPERT: Different models have different maximum output lengths, and different use cases have wildly different needs. If you're generating a title, maybe you want 50 tokens. If you're writing an essay, maybe 4096. Anthropic wants you to be explicit about this choice rather than accidentally hitting some arbitrary default.

HOST: That makes sense. And the messages array?

EXPERT: That's your conversation history. Each message has a role—either "user" or "assistant"—and content. The simplest possible request is a messages array with one user message: "Hello, Claude." But here's a critical constraint: messages must strictly alternate. You can't have two user messages in a row, or two assistant messages in a row.

HOST: What happens if I do?

EXPERT: The API rejects your request with a validation error. If you need to send multiple pieces of user content together, you put them in a single user message, not multiple messages.

HOST: Got it. Now, you mentioned earlier that the authentication header isn't the standard one. Can you break that down?

EXPERT: Sure. Most REST APIs use `Authorization: Bearer YOUR_TOKEN`. Claude uses `x-api-key: YOUR_KEY`. Just a different convention. You also need two other headers: `anthropic-version`, which is currently `2023-06-01`, and `content-type: application/json`.

HOST: And that anthropic-version header—is that the model version?

EXPERT: No! Common misconception. That header controls the API's behavior—like what fields are in the response, how certain features work. The model version is specified in the request body with the `model` parameter. So you might be using API version `2023-06-01` but requesting model `claude-opus-4-6`.

## Working with Responses

HOST: Okay, I send my request with the right headers, the right structure, everything's perfect. What comes back?

EXPERT: You get a JSON response with several key fields. There's an `id` that uniquely identifies this specific message—useful for debugging. There's the `role`, which is always "assistant" for responses. There's `content`, which is an array of content blocks—usually just text, but could also include tool use or thinking blocks.

HOST: Why is content an array instead of just a string?

EXPERT: Because a single response might contain multiple types of content. Claude might return some text, then call a tool, then return more text. Each of those is a separate block in the content array. For simple cases, you'll just have one text block, but the structure is flexible.

HOST: Makes sense. What else is in the response?

EXPERT: Two really important fields: `stop_reason` and `usage`. Stop reason tells you why the generation ended. Was it a natural completion—`end_turn`? Did it hit your max_tokens limit? Did Claude decide to call a tool? Did it refuse to answer due to safety concerns?

HOST: And I should be checking this every time?

EXPERT: Absolutely. If you just grab the text content and ignore stop_reason, you might not notice that your response got truncated because you hit max_tokens. Or that Claude tried to use a tool but you didn't handle it. The usage field is also critical—it tells you input_tokens and output_tokens, which is how you track costs and monitor rate limits.

HOST: Let's talk about that max_tokens situation. If my response gets cut off, what do I do?

EXPERT: You continue the conversation. Add the truncated assistant message to your history, then send a new user message like "Please continue." Claude will pick up where it left off. But honestly, the better solution is to set max_tokens appropriately from the start. If you're asking for an essay, don't set max_tokens to 256.

HOST: Fair point. Now I want to ask about error handling, because that 401 error I mentioned at the start—what's the full picture of things that can go wrong?

EXPERT: The most common errors are 401 for authentication—wrong API key or wrong header name. 403 means your key is valid but doesn't have permission for what you're trying to do. 429 is rate limiting—you've exceeded your requests per minute or tokens per day. And 500s are internal server errors, which are rare but do happen.

HOST: And I should retry some of these but not others, right?

EXPERT: Exactly. Never retry 401 or 403—those are permanent failures. You need to fix your credentials. 429 and 5xx errors are retryable—in fact, if you're using the official SDKs, they automatically retry these with exponential backoff. Two retries by default.

HOST: Wait, so if I'm using the SDK, I don't need to implement my own retry logic?

EXPERT: Correct—and you absolutely should not layer your own retries on top of the SDK's retries. If you do, you get multiplicative attempts. The SDK retries twice, your code retries three times, suddenly you're making six attempts with compounding delays. Configure retries at one layer only.

## Streaming for Real-Time Responses

HOST: Okay, let's shift gears. I've seen demos where Claude's response appears word by word, like it's typing. How does that work?

EXPERT: That's streaming, and it's one of the most important features for production applications. Instead of waiting for the entire response to generate and then getting it all at once, you get tokens as they're produced, in real time.

HOST: So it's like the difference between downloading a whole video file before watching versus streaming it on Netflix?

EXPERT: Perfect analogy! And the technical mechanism is called Server-Sent Events, or SSE. You set `stream: true` in your request, and instead of getting one big JSON response, you get a continuous stream of events. Each event has a type—like `content_block_delta`—and carries incremental data.

HOST: What does "incremental data" mean in practice?

EXPERT: For text, you're getting chunks of the response as they're generated. One event might contain "Hello", the next might contain "! How", the next "can I help". You accumulate these chunks client-side to build up the full response. For tool use, it's a bit more complex—you get partial JSON fragments that you have to concatenate and parse at the end.

HOST: Why would I want this complexity instead of just waiting for the full response?

EXPERT: Two huge reasons. First, perceived latency. If Claude is generating a 2000-token response, that might take 30 seconds. With streaming, the user sees progress after one second. Psychologically, that feels way faster. Second, reliability. If you're making a request that might take several minutes—like generating a very long document—you risk network timeouts on idle connections. Streaming keeps the connection active.

HOST: So for anything with a high max_tokens, I should be using streaming?

EXPERT: Anthropic's SDKs actually enforce streaming for requests expected to exceed 10 minutes, and they configure TCP keep-alive to prevent timeouts. But even if you don't need the real-time display, streaming is safer for large outputs.

HOST: Okay, but you mentioned this is more complex. What are the gotchas?

EXPERT: Biggest one: errors can happen after you've already received an HTTP 200 OK. Streaming responses return 200 immediately, then send events. If something goes wrong mid-stream—like an overloaded server—you get an error event, not an HTTP error code. So your error handling has to check event types, not just status codes.

HOST: That's sneaky. What else?

EXPERT: Tool use JSON is partial. Those `input_json_delta` events contain fragments like `{"location": "San Fran` that aren't valid JSON. You must accumulate every fragment and only parse when you get the `content_block_stop` event. If you try to parse incrementally, you'll crash.

HOST: Can't I use some kind of streaming JSON parser?

EXPERT: You can—libraries like Pydantic have partial JSON parsing—but for most use cases, it's simpler to just wait for the complete JSON. Also, if your stream gets interrupted, text blocks can sometimes be recovered, but tool use and thinking blocks cannot. You'd have to restart the whole request.

HOST: So streaming has trade-offs. When would I not use it?

EXPERT: If you're doing batch processing where latency doesn't matter, or if you're storing results in a database and don't need progressive display, non-streaming is simpler. But for interactive applications—chatbots, coding assistants, anything user-facing—streaming is basically mandatory.

## Batch Processing for Cost Savings

HOST: You mentioned batch processing earlier. What is that, and when would I use it?

EXPERT: The Message Batches API is Anthropic's asynchronous processing system. Instead of sending one request and waiting for a response, you submit up to 100,000 requests in a single batch. Anthropic processes them within 24 hours—usually under an hour—and gives you 50% off the standard API pricing.

HOST: Whoa, 50% off? What's the catch?

EXPERT: The catch is latency. This is for workloads where you don't need immediate results. Think large-scale evaluations, content moderation of user-generated content, bulk data analysis. If you're processing 10,000 support tickets overnight to categorize them, batch mode is perfect.

HOST: So I send 10,000 requests at once, and I just... wait?

EXPERT: You poll for completion. The API gives you a batch ID and a status. You check the status periodically—maybe every minute—and when it's `ended`, you download the results. Results come as a JSONL file—one JSON object per line.

HOST: And each request in the batch is just a normal Messages API request?

EXPERT: Exactly. Same structure, same parameters. You can even mix different request types—some with vision, some with tool use, multi-turn conversations. The only addition is a `custom_id` field, which you provide to match results back to requests.

HOST: Why do I need that?

EXPERT: Because results are unordered. Request 1 might finish after request 5000. The `custom_id` is how you correlate results back to your original data. Never assume submission order matches result order.

HOST: Got it. You said 50% off—does that stack with other optimizations?

EXPERT: It does! You can combine batch processing with prompt caching. If you have a shared system prompt or reference document across all requests, you can cache it. Cache hit rates in batches typically range from 30% to 98%, depending on how the requests are distributed. So you're saving 50% on batches, plus saving on cached tokens.

HOST: That's a huge cost reduction for the right workload. What are the gotchas here?

EXPERT: Validation is asynchronous. If your request has a schema error, you won't find out until processing starts. So test individual requests with the synchronous API first to catch mistakes. Also, batches expire after 24 hours. If processing doesn't complete in time, remaining requests expire—you're not charged, but you have to resubmit.

HOST: And once I get results, how long do I have to download them?

EXPERT: 29 days from batch creation, not completion. After that, results disappear. So don't submit a batch and forget about it for a month.

HOST: Makes sense. Is streaming supported in batch mode?

EXPERT: Nope. The `stream` parameter is ignored. All batch responses are complete messages. Also, batch processing isn't covered by Zero Data Retention agreements, if that matters for your compliance requirements.

## SDK Setup and Best Practices

HOST: Let's talk about SDKs, because I've been imagining curl commands this whole time, but in reality, I'm probably using Python or TypeScript, right?

EXPERT: Right. And using the official SDKs is way better than raw HTTP calls. The SDK handles authentication automatically, retries errors correctly, provides type safety, and manages streaming elegantly. Installation is simple—`pip install anthropic` for Python, `npm install @anthropic-ai/sdk` for TypeScript.

HOST: What's the first thing I do after installing?

EXPERT: Set up your API key securely. The best practice is environment variables. Create a `.env` file locally with `ANTHROPIC_API_KEY=your-key`, add `.env` to your `.gitignore` so it never gets committed, and use a library like `python-dotenv` to load it. The SDK automatically reads from the environment variable.

HOST: Why not just hardcode it in my script?

EXPERT: Because the second you commit that to GitHub, Anthropic's secret scanning will detect and revoke your key. Even if you're in a private repo, hardcoded secrets are a massive security risk. Anyone who gets access to your code gets access to your API.

HOST: Fair enough. What about in production?

EXPERT: In production, use a secrets manager—AWS Secrets Manager, GCP Secret Manager, Azure Key Vault. Your application fetches the key at startup from the secrets manager, not from a config file. This also makes key rotation way easier.

HOST: Key rotation—how often should I be doing that?

EXPERT: Every 30 to 90 days is the recommendation. And your deployment process needs to support rotation without downtime. If your app hard-fails when the key changes, you're in for a bad time.

HOST: Okay, so I've got my key loaded from the environment. How do I initialize the client?

EXPERT: In Python, it's just `client = Anthropic()`. The SDK automatically reads `ANTHROPIC_API_KEY` from your environment. You can also configure retries and timeouts at initialization—like `max_retries=3` or `timeout=30.0`.

HOST: What are the defaults?

EXPERT: Two retries and a 10-minute timeout. The timeout might surprise you—10 minutes seems long, but for AI generation, especially with high max_tokens, it's reasonable. For typical REST APIs, though, you'd want something much shorter.

HOST: Can I set different timeouts for different parts of the request?

EXPERT: Yes! You can configure connection timeout, read timeout, write timeout separately using the `httpx.Timeout` object. Connection timeout is establishing the TCP connection—usually a few seconds. Read timeout is waiting for the response—potentially much longer for AI generation.

HOST: Got it. Now, I've heard the term "type-safe API clients." What does that mean in practice?

EXPERT: It means the compiler checks that your code matches the API's contract at compile time, before you run anything. In TypeScript, you can generate types from an OpenAPI specification, and then your IDE will autocomplete request fields, warn you about typos, and catch type mismatches.

HOST: So if the API expects a number and I pass a string, my IDE tells me immediately?

EXPERT: Exactly. And when you get the response back, your IDE knows the structure and can autocomplete `response.content[0].text`. No more guessing or checking docs constantly.

HOST: That sounds amazing. Why wouldn't everyone do this?

EXPERT: The gotcha is that type safety is compile-time only in TypeScript. Once you compile to JavaScript, all type information disappears. The API could return something totally unexpected at runtime, and JavaScript won't catch it. For critical paths, you might add runtime validation with something like Zod.

HOST: So type safety plus runtime validation for maximum safety?

EXPERT: For critical paths, yes. But honestly, for most use cases, the SDK's built-in error handling is sufficient. The SDK will throw typed exceptions—`RateLimitError`, `AuthenticationError`, etc.—and you catch those.

HOST: Speaking of errors, what's the pattern for handling them correctly?

EXPERT: Catch specific exceptions, not a generic catch-all. Handle `RateLimitError` differently from `AuthenticationError`. For rate limits, you might wait and retry. For authentication, you need to fix your credentials. And remember—the SDK auto-retries 429 and 5xx errors, so if you're seeing those exceptions, it means retries already failed.

HOST: What about logging? Should I be logging every request?

EXPERT: You should definitely log request IDs. Every response from the SDK includes a `_request_id` field—something like `req_018EeWyXxfu5pfWkrYcMdjWG`. If you ever need support from Anthropic, that request ID is gold. They can trace exactly what happened.

HOST: Useful! Last thing on SDKs—async versus sync clients. When do I use which?

EXPERT: If you're making a single request and waiting for the result, sync is simpler. If you're making many requests concurrently—like processing 100 user queries in parallel—use the async client. In Python, that's `AsyncAnthropic` instead of `Anthropic`, and you use `await` with async functions.

HOST: Does async make individual requests faster?

EXPERT: No, each request takes the same amount of time. But async lets you have 100 requests in flight simultaneously instead of doing them one by one. If each request takes 2 seconds, sync takes 200 seconds total; async takes 2 seconds total, assuming you're not hitting rate limits.

## Common Mistakes and Gotchas

HOST: Alright, we've covered a ton of ground. Let's do a rapid-fire round of common mistakes. What's the thing you see people mess up most often?

EXPERT: Using `Authorization: Bearer` instead of `x-api-key`. We covered this earlier, but it's genuinely the number one mistake.

HOST: What about message structure?

EXPERT: Forgetting that messages must alternate roles. Trying to send two user messages in a row, or prefilling assistant responses without understanding that prefilling is deprecated on newer models.

HOST: Deprecated? So I shouldn't prefill at all?

EXPERT: On Claude Opus 4.6, Sonnet 4.6, and Sonnet 4.5, prefilling is deprecated. Use structured outputs or constrain behavior with the system prompt instead. On older models, prefilling still works, but Anthropic is moving away from it.

HOST: What about max_tokens?

EXPERT: Forgetting it's required, or setting it way too low and wondering why responses are truncated. If you're asking for detailed analysis, don't set max_tokens to 256. Also, different models have different maximums, so check the docs.

HOST: Retries?

EXPERT: Layering application-level retries on top of SDK retries. You end up with 3 times 3 equals 9 attempts with exponential backoff compounding. It's a mess.

HOST: Timeouts?

EXPERT: Not configuring them at all and relying on defaults, or setting them too short. A 5-second timeout might work for a title generation request, but it'll fail on a multi-paragraph essay.

HOST: Environment variables?

EXPERT: In Python, assuming `.env` files load automatically. They don't—you need `python-dotenv` and you need to call `load_dotenv()` at the start of your application.

HOST: Streaming?

EXPERT: Trying to parse partial JSON from `input_json_delta` events. Accumulate the fragments and parse once you have the complete JSON.

HOST: Batch processing?

EXPERT: Assuming results come back in submission order. Use `custom_id` to match results to requests, always.

HOST: What about rate limits?

EXPERT: Not tracking usage tokens and hitting rate limits unexpectedly. Also, thinking rate limits reset at fixed intervals—they don't. Anthropic uses a token bucket algorithm where capacity replenishes continuously.

HOST: Last one—security.

EXPERT: Hardcoding API keys, committing `.env` files to version control, or rotating keys without a plan. API keys should be treated like passwords.

## Wrap-Up

HOST: Okay, this has been incredibly practical. If someone's about to integrate with Claude's API for the first time, what are your top three pieces of advice?

EXPERT: One: Use the official SDKs, not raw HTTP calls. You'll save yourself countless hours of debugging. Two: Start with the fundamentals—get authentication, message structure, and error handling right before you worry about advanced features. Three: Test in production-like conditions early. That means realistic max_tokens, representative conversation lengths, and proper timeout/retry configuration. Don't wait until you're in production to discover your settings don't work.

HOST: And what's the one gotcha you wish everyone knew upfront?

EXPERT: The `x-api-key` header. I know we keep harping on it, but I genuinely see this mistake multiple times a week. It's such a simple thing, but it costs people hours of frustration because they assume it works like every other API they've used.

HOST: Fair! And for folks who want to optimize costs?

EXPERT: Batch processing for offline workloads gets you 50% off. Prompt caching can save 90% on repeated context. Streaming prevents wasted tokens from timeouts. And choose the right model—Haiku is way cheaper than Opus for tasks that don't need maximum capability.

HOST: Perfect. Any final thoughts?

EXPERT: Just that API integration is one of those things where the basics matter more than the fancy features. Get authentication, message structure, error handling, and retries right, and you'll have a solid foundation. Rush past those to use tool calling or vision, and you'll spend all your time debugging instead of building.

HOST: Solid advice. Thanks for breaking all this down!

EXPERT: Anytime. Happy building!
