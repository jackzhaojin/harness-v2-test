HOST: Okay, so I have to tell you about this conversation I had with a friend last week. She's building this AI customer support agent, right? And she's like, "I think it's ready to deploy." And I'm like, "How do you know?" And she goes—I swear—she goes, "Well, I've tested it a bunch of times and it seems pretty good."

EXPERT: Oh no.

HOST: Right? "Seems pretty good." That's the bar we're clearing here.

EXPERT: That's what's called—and this is the technical term—a vibe-based eval.

HOST: Wait, that's actually what it's called?

EXPERT: That's actually what it's called. Vibe-based evals. Which is just, you know, vibing with your model. Feeling it out. Seeing if the energy is right.

HOST: I mean, to be fair, when I'm cooking, that's kind of how I know if something needs more salt.

EXPERT: Okay, but here's the thing—when you under-salt your pasta, you eat a mediocre dinner. When you deploy an AI agent based on vibes, it might leak customer data, give wrong information to thousands of users, or just... completely fail in ways you never imagined.

HOST: Right, right, right. Slightly higher stakes.

EXPERT: Slightly. So this is why evaluation and testing for AI systems is, like, maybe the most important thing nobody talks about enough.

HOST: Okay, so walk me through this. Because I feel like most people think, "Oh, I'll just run some tests." But it's not that simple, is it?

EXPERT: It's so much more complicated than people think. Here's the fundamental problem: when you're building a traditional software application, testing is relatively straightforward. Does the function return the right value? Does the button do what it's supposed to do? Binary outcomes.

HOST: Pass or fail.

EXPERT: Exactly. But with AI systems—especially language models—you're not dealing with deterministic outputs anymore. You ask the same question twice, you might get two different answers. Both might be correct! Or one might be better in a way that's hard to quantify.

HOST: Oh, that's... yeah, that's a whole different beast.

EXPERT: Right? So the first thing you have to do—and I mean, this is step zero, you cannot skip this—is define what success actually means.

HOST: Okay, but like, success is when it works, right?

EXPERT: See, that's exactly the trap. What does "works" mean? Let's say you're building a calendar agent. Someone says, "Schedule a meeting with Bob tomorrow at 2pm." Does "works" mean it creates a calendar event? Sure. But what if it creates the event at 2am instead of 2pm? What if it invites the wrong Bob? What if it takes 45 seconds to respond?

HOST: Okay, I see where you're going. You need to be, like, annoyingly specific.

EXPERT: Annoyingly specific is perfect. There's actually a framework for this—SMART criteria. Specific, Measurable, Achievable, Relevant, Time-bound.

HOST: Oh, like from business school.

EXPERT: Exactly! It's the same idea. So instead of saying "the agent should handle calendar requests," you say: "The agent should successfully create calendar events in under 2 seconds with 95% accuracy, using appropriate confirmation tone, and never double-booking."

HOST: That's... yeah, that's a totally different sentence.

EXPERT: And now you can actually test it. You can measure it. You know what failure looks like.

HOST: Okay, so you've got your success criteria. Now what? How do you actually test this thing?

EXPERT: So this is where it gets interesting. There are basically three big approaches: automated evaluation, LLM-based grading, and human evaluation.

HOST: Let's start with automated. That sounds like the easy one.

EXPERT: It is the easy one! Automated evaluation is basically code-based grading. You're using deterministic algorithms to check outputs. The simplest version is exact match—does the output match the reference answer character-for-character?

HOST: Like, if I ask "What's the capital of France?" and it says "Paris," that's a match.

EXPERT: Right. And if it says "The capital of France is Paris," that's not a match.

HOST: Wait, but that second answer is also correct!

EXPERT: Exactly! This is the limitation. Exact match is great for classification tasks, multiple choice questions, things with clear-cut categorical answers. But it completely falls apart for anything open-ended.

HOST: So what else is there in the automated bucket?

EXPERT: So you've got string matching metrics like ROUGE and BLEU. These come from traditional NLP—they were originally designed for machine translation and text summarization.

HOST: I've heard of BLEU scores. That's like, how similar two pieces of text are, right?

EXPERT: Sort of. BLEU measures n-gram precision—basically, how much of your generated text appears in the reference text. ROUGE is similar but emphasizes recall instead—how much of the reference appears in your generation.

HOST: Okay, you're going to have to translate that, because I just heard word salad.

EXPERT: Fair. Let me give you an example. Say the reference answer is "The cat sits on the mat." And your model says "The cat is on the mat."

HOST: Okay, similar but not identical.

EXPERT: Right. So ROUGE-1 looks at individual words. You've got "the," "cat," "on," "mat" in common. "Sits" is missing, "is" is extra. It calculates precision, recall, and F1 score based on that overlap.

HOST: And F1 is... I should know this.

EXPERT: F1 is the harmonic mean of precision and recall. Precision is "how many of the words I generated were relevant?" Recall is "how many of the relevant words did I generate?" F1 balances both.

HOST: Okay, so these metrics give you a score between zero and one, and higher is better?

EXPERT: Exactly. But here's the thing—and this is a huge gotcha—these metrics don't understand meaning.

HOST: What do you mean?

EXPERT: Okay, so: "The cat ate the dog" versus "The dog ate the cat." Those score identically on ROUGE-1.

HOST: Oh. Oh, that's bad.

EXPERT: Right? Same words, completely different meaning. So these automated metrics are fast, they're cheap, they're reproducible. But they're kind of dumb.

HOST: So when would you actually use them?

EXPERT: They're great for baseline measurements. They're great for regression testing—making sure you didn't break something that was working. And they're great for structured outputs where exact match makes sense. But for anything nuanced? You need something smarter.

HOST: Which brings us to... LLM-based grading?

EXPERT: Yes! Okay, this is where things get really interesting. LLM-as-a-Judge.

HOST: Wait, wait, wait. You're using an AI to grade an AI?

EXPERT: I know how it sounds.

HOST: It sounds like we've created a closed loop of robot judgment.

EXPERT: I mean, kind of. But here's why it actually works: a really capable language model—like Claude Sonnet or GPT-4—can make nuanced judgments that simple string matching can't. You can give it a rubric, show it an output, and ask, "Is this good?"

HOST: Okay, but doesn't that have the same problem? Different answers each time?

EXPERT: That's where the rubric comes in. You give the judge model very specific criteria. Not "is this helpful," but "does this response include the required information X, avoid mentioning capability Y that the system doesn't have, and stay under 2 sentences?"

HOST: So you're moving the specificity from code to the prompt.

EXPERT: Exactly. And the research on this is actually pretty compelling. LLM judges can achieve over 80% agreement with human preferences. And in some tasks, they correlate with human judgment way better than exact match or F1 scores.

HOST: Okay, so you write a good rubric, you send it to the judge model, and it gives you a score.

EXPERT: Yeah. And there are a bunch of different scoring approaches. You can do binary—correct or incorrect. You can do Likert scales, like one to five. You can do pairwise comparison, where you show it two responses and ask which is better.

HOST: Which one's best?

EXPERT: It depends! Binary is most reliable but gives you less information. Likert gives you gradation but can be inconsistent. Pairwise is actually really strong for certain use cases because it's easier for the model to say "A is better than B" than to assign an absolute score.

HOST: Huh. That's actually kind of how I make decisions too. Like, I can't tell you how good a restaurant is on an absolute scale, but I can definitely tell you if I like it more than another restaurant.

EXPERT: Exactly! Our brains are wired for relative comparison.

HOST: Okay, so this sounds great. What's the catch?

EXPERT: Oh, there are so many catches.

HOST: I knew it.

EXPERT: Okay, first: position bias. In pairwise comparisons, the model often favors whichever response comes first.

HOST: You're kidding.

EXPERT: I'm not. Some studies show it can shift accuracy by 10% or more depending on order. So you have to randomize the order, or run both orderings and aggregate.

HOST: That's so weird. Why does that happen?

EXPERT: Probably the same reason humans have primacy bias. The first thing you see sets a reference point. But yeah, it's a real problem.

HOST: What else?

EXPERT: Verbosity bias. LLM judges love long answers.

HOST: Oh no.

EXPERT: Yeah. Longer responses tend to get higher scores regardless of actual quality. You have to explicitly tell the judge to penalize unnecessary length.

HOST: Okay, what about self-preference bias? Because that seems obvious.

EXPERT: Oh, absolutely. If you use Claude to evaluate Claude's outputs, it's going to be biased. So best practice is to use a different model as the judge. Or at minimum, a totally different configuration.

HOST: So you can't just have the AI grade itself on a curve.

EXPERT: Correct. Although honestly, that would be kind of hilarious. "I give myself an A+."

HOST: So with all these biases, is LLM-as-a-Judge even worth it?

EXPERT: Oh, totally. You just have to know the limitations. The big win is that it scales. You can evaluate thousands of outputs without hiring an army of human graders. And for a lot of tasks—like evaluating tone, or helpfulness, or whether a response is polite—it genuinely works well.

HOST: Okay, so we've got automated metrics for the simple stuff, LLM judges for the nuanced stuff. What about actual humans?

EXPERT: Human evaluation is the gold standard. Especially for subjective criteria—like, is this creative? Is this contextually appropriate? Is this empathetic?

HOST: But it's expensive.

EXPERT: And slow. And it doesn't scale. So the pattern that's emerged is: use human evaluation for calibration. You have humans grade a sample set, then you use that to calibrate your LLM judges or your automated metrics. And then you use the automated stuff for ongoing evaluation.

HOST: So humans set the bar, and then the machines maintain it.

EXPERT: That's a great way to put it.

HOST: Okay, I want to go back to something you mentioned earlier. You said there are different dimensions you need to evaluate. It's not just "did it work?"

EXPERT: Right. So there's this framework I really like—the Five Dimension Framework. It prioritizes evaluation criteria in order.

HOST: I'm ready. Hit me.

EXPERT: One: Safety. This is absolute. No negotiation. The system cannot leak sensitive data, it cannot cause harm, it cannot violate regulations.

HOST: That's the "do no evil" layer.

EXPERT: Exactly. If you fail safety, nothing else matters. Two: Correctness. Does it actually do the thing it's supposed to do?

HOST: The fundamental value proposition.

EXPERT: Right. Three: Reliability. Does it do the thing consistently? Not just once in a while when the stars align.

HOST: Okay, this is interesting. Because I feel like a lot of people stop at correctness.

EXPERT: They do! And then they deploy, and it works great in testing, and then in production it fails 30% of the time and they're like, "What happened?"

HOST: So reliability is basically, can you count on it?

EXPERT: Exactly. And this is where metrics like pass-at-k versus pass-to-the-k come in.

HOST: Okay, you're going to have to explain that because it sounds like you just said the same thing twice.

EXPERT: I know, the notation is confusing. Pass-at-k—with "at"—measures the probability that at least one attempt succeeds out of k tries. Pass-to-the-k—that's an exponent—measures the probability that all k attempts succeed.

HOST: Oh, so one is "did I get lucky?" and the other is "can I count on this?"

EXPERT: Perfect. Exactly right. Pass-at-k is fine for exploratory tools, like brainstorming. Pass-to-the-k is what you need for production reliability.

HOST: Got it. Okay, what are dimensions four and five?

EXPERT: Four: Efficiency. Latency and resource usage. Even a perfect answer is useless if it takes five minutes to generate.

HOST: Yeah, I'm not waiting five minutes for an AI to schedule my meeting.

EXPERT: Right. And five: User Experience. This is tone, clarity, helpfulness. The vibes, basically.

HOST: Wait, so vibes do matter, they're just last?

EXPERT: They matter! They're just not the first thing you check. If your system is unsafe or incorrect, being polite about it doesn't help.

HOST: That makes sense. Okay, so you've got your dimensions, you've got your metrics. How do you actually set thresholds? Like, how do you know if 85% accuracy is good enough?

EXPERT: Oh man, this is the part where I have to tell you something you're not going to like.

HOST: Uh oh.

EXPERT: Thresholds are guesses.

HOST: What?

EXPERT: Educated guesses, but guesses. You might say, "We need 90% correctness," and that sounds reasonable. But what if you get 87% and it turns out users are totally fine with that? Or what if you hit 92% but users hate the experience because it's too slow?

HOST: So you just have to... try it and see?

EXPERT: Basically. Thresholds are living documents. You set initial targets based on intuition and industry standards, then you refine them based on testing and production feedback.

HOST: That feels very unscientific for something that's supposed to be, you know, systematic testing.

EXPERT: I know. But think about it—what's the "right" response time for a web page? Some people say 200 milliseconds, some say 1 second. It depends on context, user expectations, what they're trying to do.

HOST: Okay, fair. So you start with a hypothesis and iterate.

EXPERT: Exactly. And this is why you need both capability evals and regression evals.

HOST: Okay, what's the difference?

EXPERT: Capability evals test new features. Things the agent struggles with. You expect low pass rates at first. The goal is to improve until it's ready to deploy.

HOST: So those are aspirational.

EXPERT: Right. Regression evals test proven capabilities. Things that should already work. They should maintain close to 100% pass rate.

HOST: And if they don't?

EXPERT: Then you broke something. That's why they're called regression tests—they catch regressions.

HOST: Got it. Okay, so you're running all these evals. How do you combine the scores? Like, if I pass correctness but fail latency, what happens?

EXPERT: This is where you need a multi-grader architecture. You define different graders for different dimensions, and you give them weights.

HOST: Like, correctness is 40% of the score, tone is 20%, latency is 20%?

EXPERT: Exactly. And then you can have different scoring modes. Weighted—where you average the weighted scores. Binary—where everything has to pass. Or hybrid—where some things are required and others are weighted.

HOST: What do you mean, some things are required?

EXPERT: Safety. Safety is always required. You can have perfect scores on everything else, but if you fail safety, the whole eval fails.

HOST: Right. Because leaking someone's social security number is not offset by being really polite about it.

EXPERT: Exactly.

HOST: Okay, I want to talk about something that's been bugging me. You mentioned RAG systems earlier. What's different about evaluating those?

EXPERT: Oh, good question. RAG—retrieval-augmented generation—has this extra retrieval step. So you're not just evaluating the generation quality, you're also evaluating the retrieval quality.

HOST: Right, because it's going out and fetching information first.

EXPERT: Exactly. So there are specific metrics for RAG. Faithfulness—does the generated answer stick to the retrieved context, or is it making stuff up?

HOST: Hallucinating.

EXPERT: Right. Context relevancy—did it retrieve the right information in the first place? And context recall—did it retrieve all the necessary information?

HOST: Oh, so it's not enough to just get some relevant context. You need all the relevant context.

EXPERT: Right. If it retrieves three documents but misses the fourth one that has the critical piece of information, that's a problem.

HOST: And how do you measure that?

EXPERT: For faithfulness, you typically use an LLM judge. You give it the context and the answer and ask, "Can this answer be deduced from this context?"

HOST: So you're checking for extrapolation.

EXPERT: Exactly. For context relevancy and recall, you can use a combination of automated metrics and LLM grading. It depends on whether you have ground truth data.

HOST: Okay, so let's say I'm building an AI agent and I want to set up evaluation. Where do I even start?

EXPERT: Start simple. Don't try to measure everything at once. There's this guideline called the 5-Metric Rule.

HOST: Only five metrics?

EXPERT: Start with two to three, actually. One or two custom metrics for your specific domain—like, are calendar events created correctly? And then two or three generic metrics—relevance, safety, latency.

HOST: Why not more?

EXPERT: Because more metrics means higher evaluation costs, more complexity in interpretation, and honestly, metrics you won't act on.

HOST: What do you mean?

EXPERT: If you're tracking ten different metrics, and seven of them never influence your decisions, why are you tracking them? Every metric should have a clear purpose.

HOST: That's a good point. I feel like in software engineering generally, people love collecting metrics they never look at.

EXPERT: Oh, absolutely. "We're very data-driven," and then nobody actually uses the data.

HOST: Guilty. Okay, so I've got my five metrics, I'm running evals. How often should I be doing this?

EXPERT: It depends on the stage. During development, constantly. Every time you make a change, run your regression evals. Make sure you didn't break anything.

HOST: That's like CI/CD for AI.

EXPERT: Exactly. Continuous integration, continuous evaluation. And then in production, you want to sample a percentage of traffic and evaluate it ongoing.

HOST: Wait, you're evaluating live user interactions?

EXPERT: Not all of them—that would be too expensive. But yeah, you sample maybe 10% of interactions and run evals on them. That's how you catch issues that didn't show up in testing.

HOST: Huh. So it's like A/B testing meets quality assurance.

EXPERT: That's actually a great analogy.

HOST: Okay, I want to talk about failure modes. What are the biggest mistakes people make with evaluation?

EXPERT: Oh, I have a list.

HOST: Of course you do.

EXPERT: Okay, number one: vague criteria. We talked about this already. "The agent should be helpful" is not a success criterion.

HOST: Right, you need specificity.

EXPERT: Two: only testing positive cases. People will test "schedule a meeting with Bob" but not "delete all my contacts."

HOST: Oh, because you need to test refusals.

EXPERT: Exactly! Your agent should appropriately refuse to do harmful or out-of-scope things. If you don't test that, you don't know if it's working.

HOST: What else?

EXPERT: Three: over-relying on ROUGE and BLEU for semantic tasks. These are lexical metrics. They're great for summarization benchmarks, but they're terrible for evaluating conversational quality or factual accuracy.

HOST: Because they don't understand meaning.

EXPERT: Right. Four: not accounting for LLM evaluator non-determinism. You run the same eval twice, you get different scores. You need to run multiple passes and aggregate.

HOST: How much variance are we talking about?

EXPERT: It depends on the task and the model, but it can be significant. This is why temperature zero is recommended for evaluation—it reduces randomness.

HOST: Okay, what's number five?

EXPERT: Five: treating thresholds as permanent. We talked about this. Your initial threshold of "90% accuracy" is a starting point, not gospel.

HOST: It's a hypothesis to be tested.

EXPERT: Exactly. And six—this is a big one—optimizing for a single metric without balance.

HOST: What happens?

EXPERT: You get pathological behavior. Like, if you optimize purely for task completion rate, your agent might develop shortcuts. It'll say "yes, I scheduled that" without actually doing it, just to boost the completion metric.

HOST: Oh, that's like Goodhart's Law. "When a measure becomes a target, it ceases to be a good measure."

EXPERT: Yes! Exactly. This is why you need multiple dimensions and negative test cases.

HOST: Okay, so I've built my eval system, I'm running tests, I'm tracking metrics. But here's my question: how do I know the eval itself is correct?

EXPERT: Oh man, that's the meta question.

HOST: Right? Like, who evaluates the evaluator?

EXPERT: So this is where human evaluation comes back in. You calibrate. You take a sample of outputs, have humans grade them, and then compare that to what your automated evals say.

HOST: And if they disagree?

EXPERT: Then you debug. Maybe your rubric is unclear. Maybe your threshold is wrong. Maybe the metric you chose doesn't actually measure what you think it measures.

HOST: So evaluation is itself an iterative process.

EXPERT: Everything is an iterative process. This is AI development—nothing is ever truly done.

HOST: That's... kind of exhausting, actually.

EXPERT: It is! But it's also kind of beautiful, right? Because you're building systems that improve over time. Your evals get better, your model gets better, your understanding of the problem gets better.

HOST: Okay, I'm going to ask you a weird question. If you could only pick one metric to track, what would it be?

EXPERT: Oh, that's tough. Gun to my head?

HOST: Gun to your head.

EXPERT: Probably... task completion rate on regression evals.

HOST: Really? Not safety?

EXPERT: I mean, safety is non-negotiable. But if your regression evals are passing, that means the thing you built still does what it's supposed to do. That's the baseline. If that starts dropping, everything else is irrelevant.

HOST: So it's like a canary in a coal mine.

EXPERT: Yeah. If your proven capabilities start failing, you know something fundamental broke. And you stop everything and figure out what happened.

HOST: That makes sense. Okay, last question. Where is all this headed? Like, what's the future of AI evaluation?

EXPERT: I think we're going to see more sophisticated hybrid approaches. Combining automated metrics with LLM judges with targeted human evaluation in smarter ways.

HOST: What does that look like?

EXPERT: Imagine an eval system that automatically identifies edge cases where the automated metrics disagree with the LLM judge. Those get flagged for human review. The human judgments then fine-tune the rubrics and thresholds.

HOST: So it's like active learning, but for evaluation.

EXPERT: Exactly. You're focusing human effort where it matters most. And over time, the system gets better at knowing when it's uncertain.

HOST: That's actually really cool. Because right now it sounds like you either go all-in on automation and miss nuance, or you go all-in on human eval and go broke.

EXPERT: Right. The future is figuring out the optimal blend.

HOST: Okay, here's what I'm taking away from this. One: "vibes" is not an evaluation strategy, no matter how good your vibes are.

EXPERT: Correct.

HOST: Two: you need to be annoyingly specific about what success means before you start testing.

EXPERT: Yes.

HOST: Three: different approaches for different needs—automated for simple stuff, LLM judges for nuanced stuff, humans for calibration.

EXPERT: Nailed it.

HOST: Four: test both what should work and what should fail.

EXPERT: Critical.

HOST: And five: evaluation itself is iterative. Your metrics, your thresholds, your rubrics—they all evolve.

EXPERT: That's exactly right.

HOST: Okay, so here's my final thought. This whole conversation has been about measuring quality in systems that are fundamentally probabilistic. And that feels like this profound philosophical challenge, right? Like, how do you create certainty from uncertainty?

EXPERT: You don't.

HOST: What?

EXPERT: You don't create certainty. You create confidence. You create bounds. You say, "I'm 95% confident this system will perform within these parameters." But there's always uncertainty.

HOST: And that's okay?

EXPERT: It has to be. Because the alternative is not deploying AI systems at all. Or deploying them based on vibes.

HOST: Right. So the goal isn't perfection, it's informed confidence.

EXPERT: That's a great way to end it. Informed confidence. You'll never know everything, but you can know enough to make good decisions.

HOST: And that's the whole point of evaluation.

EXPERT: That's the whole point of evaluation.
