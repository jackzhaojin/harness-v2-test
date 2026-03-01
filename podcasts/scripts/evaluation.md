# Podcast: Evaluation and Testing

**Episode Topic:** Evaluation and Testing
**Estimated Duration:** 35 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_evaluation.md

---

## Opening

HOST: So you've built an AI agent that answers customer support questions. You deploy it, and your boss asks the inevitable question: "Is it any good?" You pull up some responses, squint at them, and say, "Yeah, looks pretty good to me." Congratulations—you've just done what the industry calls a "vibe-based eval."

EXPERT: And vibe-based evals are exactly as scientific as they sound. The problem is, "looks good to me" doesn't scale. You can't catch regressions when you update your model. You can't compare two versions meaningfully. And you definitely can't deploy to production with any confidence.

HOST: So what's the alternative? How do you actually measure whether an AI system is working well?

EXPERT: That's what we're diving into today—the art and science of evaluating AI systems. And it all starts with something that sounds simple but trips up almost everyone: defining what "good" actually means.

## Defining Success Criteria

HOST: Okay, let's start there. When you say "define what good means," what does that actually look like in practice?

EXPERT: Think about your customer support agent example. What does success mean for that system? Most people start with something vague like "the agent should be helpful." But that's not a success criterion—it's just a wish.

HOST: Right, because what does "helpful" even mean? Is it speed? Accuracy? Not making the customer angry?

EXPERT: Exactly. A real success criterion needs to be specific and measurable. So instead of "helpful," you'd say something like: "The agent resolves customer tickets in under three conversational turns, with 95% accuracy, while maintaining a polite and empathetic tone." Now you have something you can actually test.

HOST: That sounds like the SMART goals framework from project management—Specific, Measurable, Achievable, Relevant, Time-bound.

EXPERT: That's exactly right. SMART criteria work beautifully for AI evaluation. But here's where it gets interesting—you're almost never measuring just one thing. AI systems need to succeed across multiple dimensions simultaneously, and those dimensions often conflict.

HOST: What do you mean by conflict?

EXPERT: Well, let's say you optimize purely for speed. Your agent starts giving shorter, faster responses. Great, right? Except now it's skipping important details, not being thorough, maybe even being curt with customers. You made it faster but less helpful. These trade-offs are everywhere.

HOST: So you need multiple success criteria to cover different aspects of quality.

EXPERT: Right. The research suggests thinking about five key dimensions, in priority order: safety first—that's non-negotiable. Then correctness, because that's your core value proposition. Then reliability and consistency. Then efficiency like latency and resource usage. And finally, user experience aspects like tone and clarity.

HOST: Safety is number one? Even above correctness?

EXPERT: Absolutely. A chatbot that gives you the wrong restaurant recommendation is annoying. A chatbot that leaks customer credit card numbers ends your company. Safety failures have zero tolerance.

HOST: That makes sense. So once you have these dimensions defined, what are the actual metrics you track?

EXPERT: Let's break down a few critical ones. First, there's task fidelity—does the output actually do what you asked? If the instruction is "schedule a meeting for tomorrow at 2pm," did it create a calendar event at the right time?

HOST: Okay, that's pretty straightforward. Pass or fail.

EXPERT: Exactly. Then you have consistency—can the system produce similar outputs when you run the same input multiple times? This is huge for customer-facing applications where people expect deterministic behavior.

HOST: Wait, I thought AI models were non-deterministic by nature. How do you measure consistency?

EXPERT: Great question. There's a metric called pass-to-the-k, written as "pass^k" with a superscript k. It measures the probability that all k attempts succeed. So if you run the same input five times and it works correctly all five times, that's pass^5 equals 100%. If it only works three out of five times, that's a consistency problem.

HOST: Is that different from pass-at-k? I feel like I've heard that term too.

EXPERT: Yes, and this is a common point of confusion. Pass-at-k, written with "at" instead of a superscript, measures the probability that at least one attempt out of k succeeds. That's useful for exploratory tools where you can afford to retry. But for production reliability, you want pass^k—you need it to work every time.

HOST: Got it. So pass-at-k is "did I get lucky at least once," and pass^k is "does this consistently work."

EXPERT: Perfect summary. Now, let's talk about relevance. For a RAG system—that's retrieval-augmented generation, where the AI pulls information from a knowledge base—you actually need to measure two types of relevance.

HOST: Two types?

EXPERT: Yeah. Answer relevancy asks: is the response actually addressing the user's question? Is it informative, concise, on-topic? But context relevancy asks: did you retrieve the right information in the first place? Does the retrieved context contain what's needed without a bunch of irrelevant noise?

HOST: Oh, so you could have great answer relevancy even if you pulled the wrong documents, and vice versa.

EXPERT: Exactly. You need both. And then there's faithfulness, which is critical for any system that can't afford to hallucinate. Faithfulness measures whether the generated content is factually consistent with the source material—whether every claim can actually be deduced from the provided context.

HOST: That sounds hard to measure automatically.

EXPERT: It is, and we'll get into the techniques for that later. But the key point is that you're juggling all these dimensions at once—fidelity, consistency, relevance, faithfulness, tone, latency, safety—and you need clear thresholds for each one.

## The Challenge of Measurement

HOST: Okay, so I've defined my criteria. I know I need 95% accuracy, sub-two-second latency, appropriate tone. How do I actually measure this stuff?

EXPERT: That's where evaluation methods come in, and there are basically three approaches: code-based grading, human grading, and LLM-based grading. Each has its sweet spot.

HOST: Let's start with the simplest one—code-based grading. That's just checking if the output matches what you expected, right?

EXPERT: At its core, yes. The most basic form is exact match—does the generated output match the reference text character-for-character? If you ask "What is the capital of France?" and the model says "Paris," you check if output equals "Paris." Binary, deterministic, fast.

HOST: But that seems really brittle. What if it says "The capital is Paris" instead?

EXPERT: Exactly the problem. Exact match gives you no partial credit. "Paris" matches "Paris," but "paris" doesn't match "Paris" unless you normalize for case. And "The capital is Paris" gets a zero even though it's semantically correct.

HOST: So exact match only works for very structured outputs—like classification tasks where you need a specific label.

EXPERT: Right. For anything more flexible, you need statistical metrics. The two big families are ROUGE and BLEU, which both come from traditional NLP tasks like machine translation and summarization.

HOST: I've heard of ROUGE. That's... something about overlap?

EXPERT: ROUGE stands for Recall-Oriented Understudy for Gisting Evaluation. It measures n-gram overlap between your generated text and a reference text. So ROUGE-1 looks at unigram overlap—how many individual words appear in both texts. ROUGE-2 looks at bigram overlap—two-word sequences.

HOST: And ROUGE-L? I see that one a lot.

EXPERT: ROUGE-L measures the longest common subsequence between the candidate and reference. It captures word order, which the other ROUGE metrics miss. If your candidate is "The cat on the floor sits" and the reference is "The cat sits on the floor," ROUGE-L detects that ordering difference.

HOST: Okay, so ROUGE gives you a score from 0 to 1 based on how much overlap there is. Higher is better.

EXPERT: Exactly. And it gives you three numbers: precision, recall, and F1. Precision is how much of your output appears in the reference—are you staying on topic? Recall is how much of the reference appears in your output—are you covering everything? F1 is the harmonic mean of both.

HOST: Why does F1 matter if you already have precision and recall?

EXPERT: Because it prevents gaming. If you only optimize for recall, you could just output a giant verbose response that includes everything. You'd get perfect recall but terrible precision. F1 balances both, so you can't cheat by optimizing just one dimension.

HOST: Got it. And BLEU is similar to ROUGE?

EXPERT: Similar idea, different emphasis. BLEU calculates n-gram precision with a brevity penalty. It was designed for machine translation, and it emphasizes precision—how much of the output appears in the reference—whereas ROUGE emphasizes recall. So BLEU punishes extra stuff you added; ROUGE punishes things you left out.

HOST: When would you use one versus the other?

EXPERT: Generally, use ROUGE for summarization tasks where you want to make sure you covered the key points. Use BLEU for translation tasks where you want to make sure you didn't add incorrect information. But honestly, for modern LLM evaluation, both have a major limitation.

HOST: They don't understand meaning.

EXPERT: Exactly. They're purely lexical. "The cat ate the dog" versus "The dog ate the cat" score identically on ROUGE-1 because they have the same unigrams. But the meaning is completely different.

HOST: So these metrics are useful baselines, but they can't be your only measure of quality.

EXPERT: Right. They're great for regression testing—making sure you didn't break something that was working. They're fast, deterministic, reproducible. But for evaluating semantic quality, conversational tone, creativity, nuance—you need something smarter.

## LLM-as-a-Judge

HOST: Which brings us to LLM-based grading. You're using an AI to evaluate AI?

EXPERT: Exactly. It sounds circular, but it works surprisingly well. The idea is you take a capable model—often a different, more powerful model than the one you're testing—and you give it the original input, the generated response, and a scoring rubric. Then you ask it to evaluate the quality.

HOST: And this is better than code-based metrics because the judge can understand semantics, context, nuance?

EXPERT: Right. If the reference answer is "Paris" and the model outputs "The capital of France is Paris," exact match fails but an LLM judge correctly recognizes them as equivalent. Even better, the judge can evaluate things that resist simple metrics—like whether the tone is empathetic, whether the response is unnecessarily verbose, whether it addresses the underlying intent of the question.

HOST: How reliable is this? Like, if I run the same evaluation twice, do I get the same score?

EXPERT: That's one of the gotchas. LLM judges aren't perfectly deterministic, even with temperature set to zero. You can get slightly different scores across runs. For important decisions, best practice is to run multiple evaluation passes and aggregate the scores.

HOST: What does the actual implementation look like?

EXPERT: At its simplest, you build a prompt that provides the answer and the rubric, then asks for a judgment. For example: "Here is the answer the assistant gave. Here is the rubric for what makes it correct or incorrect. First think through whether the answer meets the criteria, then output 'correct' or 'incorrect.'"

HOST: You're asking it to think first before scoring?

EXPERT: Yes, and that's critical. This is called chain-of-thought reasoning. When you instruct the judge to explain its reasoning before providing the score, the evaluation quality improves significantly—especially for complex judgments.

HOST: Is it like showing your work in math class?

EXPERT: Exactly. The model is less likely to jump to a snap judgment. It's forced to articulate the reasoning, which catches errors. The research shows that explanation-first ordering improves alignment with human judgment.

HOST: What kind of scores can you produce? Is it just binary correct/incorrect?

EXPERT: You can use several approaches. Binary is the simplest—yes or no, correct or incorrect. Then there's Likert scales, typically 1 to 5, where each point is defined explicitly. Like, "1 means factually incorrect, 3 means mostly accurate with minor errors, 5 means completely accurate and well-sourced."

HOST: What about comparing two responses—which one is better?

EXPERT: That's called pairwise comparison, and it's often more reliable than absolute scoring. It's easier for a judge to say "response A is better than response B" than to assign a precise numerical score to each one independently.

HOST: So you'd generate two responses and ask the judge to pick the winner?

EXPERT: Exactly. This is really useful for A/B testing different prompts or model versions. But there's a huge gotcha here.

HOST: What's that?

EXPERT: Position bias. LLM judges often favor whichever response appears first, regardless of actual quality. Swapping the order can shift accuracy by 10% or more.

HOST: That's wild. How do you fix it?

EXPERT: You randomize the order, or you run both orderings and aggregate the results. If response A wins when it's first and also wins when it's second, you can be confident it's actually better.

HOST: What other biases do you have to watch out for?

EXPERT: Verbosity bias is a big one. LLM judges often prefer longer, more detailed responses even when the shorter response is actually better. You have to explicitly instruct the judge to penalize unnecessary length.

HOST: And I'm guessing there's self-preference bias? Like, if Claude is evaluating Claude's outputs?

EXPERT: Absolutely. An LLM evaluating its own outputs tends to assign higher scores due to familiarity with its own style. Best practice is to use a different model as judge—or at minimum, a different configuration or prompt template.

HOST: This is starting to sound like there are a lot of ways to get this wrong.

EXPERT: There are. But when you do it right—clear rubrics, decomposed criteria, chain-of-thought reasoning, bias mitigation—LLM-as-judge can achieve over 80% agreement with human preferences in pairwise comparisons. That's a Pearson correlation of 0.85 versus human judgment, compared to 0.17 for exact match and 0.36 for F1 scores.

HOST: That's a huge improvement.

EXPERT: It is. And it scales in a way that human evaluation doesn't. You can evaluate thousands of responses per day at reasonable cost.

## Designing Rubrics

HOST: You keep mentioning rubrics. What makes a good rubric for LLM evaluation?

EXPERT: A good rubric is specific, unambiguous, and defines each score level with concrete examples. A bad rubric says "Score 5 if the response is high quality." What does that mean?

HOST: Everything and nothing.

EXPERT: Exactly. A good rubric says, "Score 5 if the response fully addresses the query, is factually accurate, uses appropriate tone, and includes no unnecessary information. Score 4 if it addresses the query with minor omissions but remains accurate. Score 3 if it partially addresses the query or contains minor inaccuracies." And so on.

HOST: So you're giving the judge clear decision criteria for each score level.

EXPERT: Right. And ideally, you're evaluating one dimension at a time rather than asking for a holistic score. Instead of "rate the overall quality from 1 to 5," you ask separate questions: "Rate the factual accuracy from 1 to 5. Rate the clarity from 1 to 5. Rate the relevance from 1 to 5."

HOST: Why is that better?

EXPERT: Because it's easier to make consistent judgments on single-objective tasks. If you ask for one overall quality score, the judge has to implicitly weight accuracy versus clarity versus relevance, and that weighting might be inconsistent. If you ask separately, you can control the weighting explicitly.

HOST: And then you combine the scores based on your priorities.

EXPERT: Exactly. Maybe accuracy is worth 40% of your overall score, clarity is 20%, relevance is 20%, and tone is 20%. You define those weights based on what matters for your application.

HOST: What about providing a "golden answer" for reference? Does that help?

EXPERT: Absolutely. Reference-based evaluation improves consistency significantly. You give the judge both the generated response and a golden answer, and you ask whether the generated response meets the same standard. This anchors the evaluation and reduces drift over time.

HOST: Drift?

EXPERT: The tendency for evaluation criteria to shift subtly over time, especially if you're doing ongoing human review. With a reference answer, you have a fixed benchmark.

## Practical Evaluation Design

HOST: Let's say I'm building an evaluation pipeline from scratch. Where do I start?

EXPERT: Start with the simplest thing that could possibly work. For many applications, that's exact match or string presence checks for structured outputs, combined with one or two automated metrics like ROUGE for content quality.

HOST: So establish a baseline with code-based grading first.

EXPERT: Right. Run your eval suite and see where the gaps are. You'll quickly discover which aspects resist simple measurement. That's when you layer in LLM-based grading for the dimensions that need it—tone, nuance, semantic correctness.

HOST: How many metrics should I track?

EXPERT: There's a "5-metric rule" that gets thrown around. Start with 2 to 3 metrics covering critical dimensions. Typically one or two custom metrics tailored to your domain—using LLM-as-judge or functional tests—and two or three generic metrics for common requirements like relevance, safety, and latency.

HOST: Why not just track everything?

EXPERT: Because more metrics means higher evaluation costs, longer run times, and more complexity in interpretation. If you're not going to act on a metric, don't measure it.

HOST: That makes sense. What about test case design? How do I build a good eval set?

EXPERT: Always test both positive and negative cases. Positive cases are things the agent should do successfully—"Schedule a meeting with Bob tomorrow at 2pm" should result in a calendar event. Negative cases are things the agent should refuse or handle gracefully—"Delete all my contacts" should be politely declined.

HOST: So you're making sure it both does what it should and doesn't do what it shouldn't.

EXPERT: Exactly. And you want a mix of capability evals and regression evals. Capability evals test new features or tasks the agent struggles with. They'll have low pass rates initially—that's expected. Success means you're ready to deploy that capability.

HOST: And regression evals?

EXPERT: Those should maintain close to 100% pass rate. They test proven capabilities. If a regression eval starts failing, that's a red flag—you broke something that was working.

HOST: How many test cases do you need?

EXPERT: It depends on the task complexity and risk tolerance. For high-stakes applications like healthcare or finance, you might need hundreds or thousands of cases covering edge cases. For lower-stakes applications, a couple dozen well-designed cases can give you solid coverage.

HOST: What makes a test case well-designed?

EXPERT: Specificity in the success criteria. Don't just say "the agent should schedule the meeting." Say "the agent should create a calendar event with the correct title, time, date, and attendee, respond with confirmation, and complete the task in under 2 seconds."

HOST: So you're back to those SMART criteria from the beginning.

EXPERT: Everything comes back to defining success clearly. Vague criteria doom evaluations. You can have the most sophisticated evaluation pipeline in the world, but if you don't know what you're measuring, it's useless.

## Common Mistakes

HOST: What are the biggest mistakes you see people make when building evals?

EXPERT: The number one mistake is skipping evals entirely and relying on vibes. People test a few examples manually, think "looks good," and ship it. Then they have no idea if a prompt change or model update broke something.

HOST: So the first mistake is not having evals at all.

EXPERT: Right. The second mistake is treating thresholds as fixed. Someone decides "we need 90% accuracy" without any data, then discovers that's either impossible or way too lenient. Thresholds should be living documents that you refine based on actual performance and production feedback.

HOST: What about the metrics themselves? What do people get wrong there?

EXPERT: Using BLEU or ROUGE as the sole measure of quality for conversational AI. These metrics have their place, but they don't capture semantics. A hallucinated response can score well on ROUGE if it shares vocabulary with the reference.

HOST: So they're useful as part of a suite, but not standalone.

EXPERT: Exactly. Another common mistake is conflating BLEU and ROUGE—using the wrong one for the task. BLEU emphasizes precision, ROUGE emphasizes recall. Use ROUGE for summarization, BLEU for translation. Don't mix them up.

HOST: What about LLM-as-judge mistakes?

EXPERT: Using overly complex scales. Some people create 7-point or 10-point Likert scales, and the judge can't reliably distinguish between, say, a 6 and a 7. Research shows binary, 3-point, or 5-point scales with clearly defined anchors are much more reliable.

HOST: And generic chain-of-thought prompts?

EXPERT: Yeah, just adding "think step by step" doesn't do much. You need to specify the actual reasoning steps you want the judge to perform. "First, identify the claims made. Second, check each claim against the context. Third, assess whether any claims are unsupported."

HOST: That's much more concrete.

EXPERT: Right. And here's a subtle one: over-optimization. If you optimize purely for completion rate, your agent might develop inappropriate shortcuts. Like, it completes every task instantly by saying "sure, done!" without actually doing anything.

HOST: So you need balanced criteria with checks and balances.

EXPERT: Exactly. Test both that it does what it should and that it doesn't do what it shouldn't. Positive and negative cases together prevent gaming the metrics.

HOST: What about domain expertise? Are there limits to what LLM judges can evaluate?

EXPERT: Absolutely. In specialized domains like medicine or law, LLM judge agreement with human experts can drop to 60-68%. For high-stakes evaluations in expert domains, you need hybrid workflows—LLM judges for scalability, human experts for calibration and edge cases.

HOST: So LLM-as-judge isn't a complete replacement for human evaluation.

EXPERT: It's a complement. You use LLM judges to scale evaluation to thousands of examples. You use human evaluation to calibrate your rubrics, catch edge cases, and make final calls on ambiguous situations. The two work together.

## RAG System Evaluation

HOST: We've mentioned RAG systems a few times—retrieval-augmented generation. Are there special considerations for evaluating those?

EXPERT: RAG systems add complexity because you have two stages to evaluate: retrieval and generation. A RAG system can fail in different ways at each stage, so you need metrics for both.

HOST: What's the retrieval stage responsible for?

EXPERT: The retrieval stage pulls relevant documents or passages from a knowledge base based on the user's query. It can fail by retrieving irrelevant information, missing critical information, or retrieving too much noise.

HOST: And the generation stage?

EXPERT: That's where the LLM takes the retrieved context and generates a response. It can fail by hallucinating information not in the context, by missing information that is in the context, or by giving an irrelevant answer even when the context is good.

HOST: So you need separate metrics for "did we retrieve the right stuff" and "did we use it correctly."

EXPERT: Exactly. Context relevancy measures retrieval quality—does the retrieved context contain the necessary information without redundancy? Context recall measures completeness—did we retrieve all the information needed to answer the question?

HOST: And for the generation stage?

EXPERT: Faithfulness measures whether the generated answer is factually consistent with the retrieved context. Every claim should be deducible from the provided information. Answer relevancy measures whether the response actually addresses the user's question.

HOST: So you could have perfect faithfulness but poor answer relevancy if you answered the wrong question accurately.

EXPERT: Exactly right. And you could have great answer relevancy but poor faithfulness if you hallucinated a convincing answer. You need both.

HOST: How do you measure faithfulness automatically?

EXPERT: Typically with LLM-as-judge. You give the judge the generated answer and the source context, and you ask: "Can every claim in this answer be deduced from this context? Output 'yes' if faithful, 'no' if it contains unsupported claims."

HOST: And that works?

EXPERT: It works well enough for most applications, especially if you use a capable judge model. For high-stakes applications, you'd want human review as well.

## Production Evaluation

HOST: Let's talk about production. Once your system is deployed, how do you keep evaluating it?

EXPERT: You need ongoing monitoring, not just pre-deployment evals. The simplest approach is to sample a percentage of production traffic and run your eval suite on it.

HOST: Like, evaluate 10% of real user interactions?

EXPERT: Exactly. You log the inputs and outputs, run them through your automated metrics and LLM judges, and track the scores over time. If you see a sudden drop in quality, that's a signal something changed—maybe the model provider updated their API, maybe your prompt broke in an edge case.

HOST: What's a reasonable sample rate?

EXPERT: It depends on volume and cost tolerance. For high-volume applications, even 1% can give you thousands of examples per day. For lower-volume, you might sample 10-20% or even evaluate everything.

HOST: And you're looking for trends over time, not individual failures.

EXPERT: Right. Individual failures will always happen—no system is perfect. What matters is the aggregate metrics. Are you maintaining your target accuracy? Is latency creeping up? Is tone degrading?

HOST: Do you run the same evals in production that you ran before deployment?

EXPERT: Mostly yes, but with some adjustments. In production, you often care more about latency and cost than you did in testing. You might add metrics around API costs, token usage, and cache hit rates that weren't priorities during development.

HOST: And you're collecting data for future eval sets.

EXPERT: Absolutely. Production failures are gold for building better evals. Every time you catch a mistake, you should add that case to your regression suite so you never regress on it again.

## Wrap-up

HOST: Alright, we've covered a lot of ground. Let's bring it home. If someone is building evals for the first time, what are the key takeaways they absolutely need to remember?

EXPERT: First, define success criteria explicitly. "The agent should be helpful" is not a criterion. "Resolves tickets in under three turns with 95% accuracy and polite tone" is.

HOST: Specific, measurable, with clear thresholds.

EXPERT: Exactly. Second, use the right evaluation method for the task. Code-based grading for exact matches and structured outputs. LLM-as-judge for semantic quality, tone, and nuance. Human evaluation for calibration and high-stakes decisions.

HOST: Match the tool to the job.

EXPERT: Right. Third, measure multiple dimensions and acknowledge trade-offs. Don't optimize purely for speed at the expense of accuracy, or purely for completion rate at the expense of safety. Balanced criteria prevent unintended behaviors.

HOST: And fourth?

EXPERT: Test both positive and negative cases. Make sure your agent does what it should and doesn't do what it shouldn't. This prevents gaming the metrics and catches refusal-handling bugs.

HOST: Anything else?

EXPERT: Treat thresholds as living documents. Your initial targets are educated guesses. Refine them based on production data and user feedback. And finally, keep iterating. Evaluation is not a one-time setup—it's an ongoing process that evolves with your system.

HOST: Eval everything, iterate constantly, and never trust vibes.

EXPERT: That's the mantra.

HOST: Thanks for breaking this down. I think I'm ready to build some actual evals instead of just squinting at outputs and hoping for the best.

EXPERT: That's the goal. Good luck out there.
