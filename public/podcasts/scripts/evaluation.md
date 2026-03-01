HOST: So okay, here's something that's been bugging me. You build this amazing AI agent, right? It can write code, it can answer questions, it can draft emails. And someone asks you, "Is it good?" And you just... stare at them.

EXPERT: Because you don't actually know.

HOST: You don't know! You ran it a bunch of times, it seemed fine, you showed it to a couple people, they said "yeah, looks good." And that's your entire evaluation strategy.

EXPERT: You've just described what the industry lovingly calls "vibe-based evals."

HOST: Vibe-based evals. I love that term and I hate it at the same time.

EXPERT: It's painfully accurate though. And here's the thing — a shocking number of teams in production right now are still doing exactly this. They're shipping AI systems where the evaluation process is basically "I ran it ten times and it felt right."

HOST: Which is wild when you think about it, because we would never do that with regular software. Like, you wouldn't ship a payment system and say "yeah, it processed the last few transactions correctly, ship it."

EXPERT: Right, right, right. And it gets worse. Because with traditional software, at least when it breaks, it breaks the same way every time. With LLMs, you get this whole other dimension — the same input can give you different outputs across runs.

HOST: Okay so let's fix this. Where do you even start? Because the problem feels kind of overwhelming. Like, how do you even define "good" for something that generates open-ended text?

EXPERT: So this is actually where everything begins — defining success criteria. And there's a framework people use called SMART. Specific, Measurable, Achievable, Relevant, Time-bound. And I know, I know, it sounds like corporate buzzword territory—

HOST: It sounds like something from a management seminar, yeah.

EXPERT: It does! But stick with me. The reason it matters is because it forces you to go from "the agent should handle calendar requests" to something like "the agent should successfully create calendar events with the correct time and attendees in under two seconds, with 95% accuracy."

HOST: Oh, that's a totally different statement. One you can actually test against.

EXPERT: Exactly. And what's interesting is that success criteria aren't one-dimensional. A customer support agent isn't just measured on "did it resolve the ticket?" It also needs to do it within a reasonable number of turns, maintain the right tone, not leak sensitive information—

HOST: Wait, not leak sensitive information? That's a success criterion?

EXPERT: Privacy compliance is huge. And this is where it gets really interesting, because these dimensions often conflict with each other. Like, optimizing for speed might mean the agent gives shorter, less thorough answers.

HOST: It's like... you know when you're at a restaurant and the waiter is trying to be fast but also attentive but also not hovering? Those are competing objectives.

EXPERT: That's a great analogy. And so what the research suggests is this five-dimension framework where you prioritize in a specific order. Safety first — that's non-negotiable, zero tolerance. Then correctness. Then reliability. Then efficiency. And finally user experience, things like tone and clarity.

HOST: So safety is always the floor, not a nice-to-have.

EXPERT: Always. And here's where I think people get tripped up. They'll say "well, our agent is 98% accurate." Great. But what about the other 2%? If that 2% includes cases where it leaks someone's medical records, your 98% accuracy number is meaningless.

HOST: Huh. I never thought about it that way. So you need to test both the things it should do AND the things it shouldn't.

EXPERT: Yes! Balanced test design. You need positive test cases — "schedule a meeting with Bob at 2pm" and verify it creates the right event. But you also need negative cases — "delete all my contacts" and verify it refuses politely.

HOST: Okay so we've got our criteria defined. Now here's where I think it gets really gnarly. How do you actually measure this stuff? Because some of these dimensions — like tone — that's not something you can just write a unit test for.

EXPERT: So this is where we get into the different grading methods, and there are essentially three tiers. First tier, the foundation: automated metrics. Code-based, deterministic, fast. Second tier: LLM-as-a-judge. You use a model to evaluate another model. Third tier: human evaluation. Gold standard, but slow and expensive.

HOST: Let's start at the bottom. The automated stuff. What does that actually look like?

EXPERT: Okay so the simplest one is exact match. Did the output match the expected answer character for character? It sounds basic, and it is basic, but it's incredibly useful for things like classification tasks or extractive QA where there's one right answer.

HOST: But it's also kind of fragile, right? Like "42" versus "42 period" would fail.

EXPERT: Super fragile! You always want to normalize — strip whitespace, lowercase everything, handle punctuation. But even then, the fundamental limitation is that "Paris" and "The capital of France is Paris" — those fail exact match even though they convey the same information.

HOST: So you need something smarter.

EXPERT: Which brings us to ROUGE scores. And okay, this is going to sound nerdy but I actually find these really elegant. ROUGE stands for Recall-Oriented Understudy for Gisting Evaluation—

HOST: That is the most academic acronym I've ever heard.

EXPERT: It really is. But what it does is straightforward — it measures the overlap of n-grams between what the model generated and a reference answer. ROUGE-1 looks at individual words, ROUGE-2 looks at word pairs, and ROUGE-L looks at the longest common subsequence.

HOST: The longest common what now?

EXPERT: Subsequence. So imagine the reference is "the cat sits on the floor" and the model says "the cat on the floor sits." ROUGE-1 would score those pretty similarly because they share most of the same words. But ROUGE-L catches that the word order is different, because the longest sequence of words that appear in the same order is shorter.

HOST: Oh! So it's capturing structure, not just vocabulary.

EXPERT: Exactly. And then there's BLEU, which comes from machine translation—

HOST: I always mix up ROUGE and BLEU. Which one does what?

EXPERT: Great question and this trips people up all the time. ROUGE is recall-oriented — how much of the reference shows up in the output? BLEU is precision-oriented — how much of the output appears in the reference? Think of it this way: ROUGE asks "did you cover everything important?" and BLEU asks "did you avoid making stuff up?"

HOST: Oh, that's actually a clean way to think about it. So for summarization you'd want ROUGE because you care about coverage.

EXPERT: Right. And for translation you'd want BLEU because you care about the output being correct. But here's the gotcha that I think is really important — and honestly this kind of blew my mind when I first learned it.

HOST: Go on.

EXPERT: These metrics have no semantic understanding whatsoever. "The cat ate the dog" and "the dog ate the cat" — those get identical ROUGE-1 scores.

HOST: Wait. Seriously?

EXPERT: Same exact words, same n-gram overlap. ROUGE-1 can't tell the difference. And it gets worse — a hallucinated response that happens to share vocabulary with the reference can score well even though it's completely wrong.

HOST: That's... actually kind of terrifying. So you could have a model that's confidently making stuff up and your evaluation metric is giving it a thumbs up.

EXPERT: Which is exactly why you can't rely on any single metric. And there's this wild statistic from ACL 2023 — 76% of academic papers that cite ROUGE are referencing software packages that have known scoring errors. And only 5% of those papers even list their configuration parameters.

HOST: So people are evaluating their models with broken tools and not even documenting which version of the broken tool they used.

EXPERT: Welcome to the state of NLP evaluation. It's... not great.

HOST: Okay, I'm starting to see why just using these automated metrics isn't enough. So that brings us to this LLM-as-a-judge idea, which — I'll be honest — when I first heard about it, it sounded a little circular. You're using AI to judge AI?

EXPERT: I totally get that reaction. And you're right to be skeptical. But here's why it actually works better than you'd expect. The judge model is typically more capable than the model being evaluated. And you give it a very specific rubric — not just "is this good?" but "here are the exact criteria, here's what each score means, reason through it step by step."

HOST: So it's less like asking a student to grade their own homework and more like asking a professor to grade the student's homework.

EXPERT: That's the idea. And the numbers back it up — LLM-as-a-judge evaluations can hit over 80% agreement with human preferences in side-by-side comparisons. And in some tasks like extractive QA, the correlation with human scores is something like 0.85.

HOST: How does that compare to the automated metrics we were just talking about?

EXPERT: Exact match gets a correlation of 0.17. F1 scores get 0.36.

HOST: Point-one-seven?! That's basically random!

EXPERT: It's not great. And that's the whole argument for LLM-based grading — it bridges this massive gap between cheap-but-dumb automated metrics and expensive-but-accurate human evaluation.

HOST: So how does it actually work in practice? Like, what does the prompt look like?

EXPERT: The core pattern is: you give the judge the original question, the model's response, and a rubric with explicit score definitions. Then — and this part is key — you tell it to explain its reasoning first, before giving a score. Chain-of-thought evaluation.

HOST: Why does the order matter?

EXPERT: This is actually a fascinating finding from the research. When you ask for the score first and explanation second, the model kind of anchors on a number and then rationalizes it. But when you force it to reason through the criteria first, the scores end up much more aligned with human judgment.

HOST: So it's like... if I asked you "rate this restaurant 1 to 5" versus "tell me about the food, the service, the atmosphere, and then give me a rating." The second one is going to be more thoughtful.

EXPERT: Perfect analogy. And there's another trick — evaluating one dimension at a time. Instead of asking "how good is this response overall?" you ask "how accurate is it?" then separately "how clear is it?" then "how relevant is it?" Each evaluation is tighter and more consistent.

HOST: Okay but I have to ask about the biases. Because if ROUGE can't tell the difference between "the cat ate the dog" and "the dog ate the cat," surely LLM judges have their own blind spots.

EXPERT: Oh, they absolutely do. And some of them are sneaky. The big three are position bias, verbosity bias, and self-preference bias.

HOST: Break those down for me.

EXPERT: Position bias — when you show the judge two responses side by side and ask which is better, it will tend to prefer whichever one comes first. And we're not talking about a tiny effect. Swapping the order can shift the accuracy by ten percent or more.

HOST: Ten percent?! Just from the order?

EXPERT: Just from the order. The fix is to either randomize which response goes first, or actually run the evaluation twice with both orderings and take the consensus.

HOST: That doubles your cost though.

EXPERT: It does. Tradeoffs everywhere. Verbosity bias is the next one — LLM judges tend to prefer longer, more detailed responses even when the shorter one is actually better.

HOST: Oh, I've seen that in humans too. You show someone a longer answer and they assume it's more thorough.

EXPERT: Same instinct, basically baked into the model. The fix there is to explicitly tell the judge to penalize unnecessary length. And then self-preference bias — an LLM evaluating its own outputs tends to give itself higher scores.

HOST: That one seems obvious in retrospect but I bet people still do it.

EXPERT: All the time. The best practice is to always use a different model as your judge, or at minimum, a different prompt configuration. And honestly, for high-stakes stuff like medical or legal domains, LLM judge agreement with human experts drops to the 60-68% range.

HOST: So you really do still need humans in the loop for some things.

EXPERT: For some things, absolutely. This is where the multi-grader architecture comes in, and I think this is actually the most practical thing we'll talk about today.

HOST: Okay, hit me.

EXPERT: So instead of relying on any single evaluation method, you combine multiple graders. Imagine this: you have a code-based grader that checks functional correctness — did the output match the expected format? That gets a weight of, say, 40%. Then an LLM rubric grader checks tone — is it polite, concise, helpful? That gets 20%. A latency check — did it respond under two seconds? Another 20%. And then a binary safety check that must pass regardless of everything else.

HOST: The safety one being pass-fail is smart. Like, you don't get to average your way out of a safety violation.

EXPERT: Exactly. "You were so helpful in all these other ways" doesn't matter if you leaked someone's social security number. The safety grader has what they call a "required: true" flag — everything else can be a weighted score, but safety is a hard gate.

HOST: This is making me think about pass-at-k versus pass-to-the-k. I saw that distinction somewhere and it kind of melted my brain.

EXPERT: Oh this is good. Okay so pass-at-k asks: if I run the system k times, does it succeed at least once? That's great for exploratory tools — like a coding assistant where you might generate five solutions and pick the best one.

HOST: Right, you only need one good answer.

EXPERT: But pass-to-the-k, or pass-hat-k, asks: if I run it k times, does it succeed every single time? And that's the production reliability metric. Because if your customer support bot fails one out of five times—

HOST: That's 20% of your customers having a bad experience.

EXPERT: Right! And it's not like they're going to say "well, four out of five times it works great." They're going to remember the one time it didn't.

HOST: Okay, so let me see if I can put this whole picture together. You start by defining very specific success criteria — not "be helpful" but exactly what helpful means for your use case. You prioritize safety above everything, then correctness, then reliability.

EXPERT: Right so far.

HOST: Then for actually measuring those criteria, you layer your approaches. Automated metrics like exact match and ROUGE for the stuff that has clear right answers. LLM-as-a-judge for the nuanced stuff like tone and relevance. Humans for calibration and high-stakes edge cases.

EXPERT: And you don't just test once — you maintain two separate evaluation suites.

HOST: The capability evals and the regression evals.

EXPERT: Yes! Capability evals test the new stuff. Pass rates start low and you're trying to push them up. Regression evals test the stuff that already works — those should stay near 100%. If a regression eval starts failing, you know you broke something.

HOST: It's like... capability evals are your aspirations and regression evals are your promises.

EXPERT: Oh, I like that. I'm stealing that.

HOST: Go ahead. But here's what I keep coming back to — the thresholds. When you say 95% accuracy or response under two seconds, how do you even pick those numbers? Isn't that just... a guess?

EXPERT: It is a guess! And I think that's actually the most honest and important thing to acknowledge. The research is very clear on this — threshold setting is iterative. Your first threshold is an educated guess. You set it, you run your evals, you look at the results, and you adjust.

HOST: So the thresholds are living documents.

EXPERT: They have to be. Because here's what happens if you don't treat them that way — you either set the bar too low and ship a crappy product, or you set it too high and never ship anything. And there's another gotcha here that I think is really sneaky.

HOST: What's that?

EXPERT: Over-optimization. If you optimize purely for one metric — say, task completion rate — the agent might start developing these weird behaviors. Like, it might start completing tasks that it really shouldn't complete. "Delete all my contacts" — well, technically completing that request would boost the completion rate.

HOST: Oh no. So the eval is technically passing but the agent is doing something terrible.

EXPERT: Which is why you need those balanced test cases we talked about earlier. The positive cases AND the negative cases. And honestly, this is where the whole "start with 2-3 metrics, not 20" advice really shines.

HOST: The five-metric rule thing?

EXPERT: Yeah — one or two custom metrics for your specific domain, two or three generic ones for the common stuff like relevance, safety, latency. Don't track metrics you won't act on, because every additional metric adds evaluation cost and interpretation complexity.

HOST: That's a good principle. If you're not going to change your behavior based on the metric, why measure it?

EXPERT: Exactly. And that connects to something bigger that I think is the real takeaway from all of this research. Evaluation isn't a phase you do at the end. It's not a checkbox before deployment. It's this ongoing, evolving discipline that starts on day one and never actually stops.

HOST: Because the models change, the use cases change, the edge cases you discover in production surprise you.

EXPERT: And your understanding of "good" changes too. The criteria you set in week one are not going to be the criteria you care about in month six. You'll discover failure modes you never imagined, and you'll need to add evals for those.

HOST: So in a weird way, your evaluation suite becomes this living record of everything that's ever gone wrong.

EXPERT: And everything you've decided matters. It's like... each eval is a lesson learned, encoded as a test.

HOST: There's something kind of beautiful about that, actually. Your test suite tells the story of what your system has been through.

EXPERT: And here's what I think is the most counterintuitive part of all of this — the best evaluation systems aren't the ones with the most sophisticated metrics. They're the ones that start simple, iterate fast, and treat every production incident as a new test case.

HOST: So you don't need to build the perfect eval framework before you ship.

EXPERT: You need to build one that's honest about what it can and can't measure, and that grows with your system. Start with exact match for the easy stuff, add an LLM judge when you need nuance, bring in humans when the stakes are high enough. But the key is to start. Because the alternative—

HOST: Vibe-based evals.

EXPERT: Vibe-based evals. And honestly, the scariest thing about vibe-based evals isn't that they're inaccurate. It's that they feel accurate. You run the system ten times, it works great, and you develop this false confidence.

HOST: Until you hit that edge case in production that your ten examples never covered.

EXPERT: And now I'll leave you with this thought. Think about the last AI system you worked with — not built, just used. How do you know it was evaluated well? What would it take for you to trust it with something that actually matters?

HOST: That's... yeah. That question's going to stick with me. Because the answer for most systems right now is "I don't know and I can't know," and that's a little unsettling.

EXPERT: And maybe that's the most useful thing evaluation gives you — not certainty, but the ability to be specific about your uncertainty. Instead of "it works well," you can say "it completes this type of task correctly 94% of the time, responds in under two seconds, and has never failed a safety check across ten thousand test cases."

HOST: You still can't say it's perfect.

EXPERT: You can never say it's perfect. But you can say exactly where you've looked and what you've found. And that's a completely different conversation to have with your stakeholders than "yeah, it seemed fine when I tried it."
